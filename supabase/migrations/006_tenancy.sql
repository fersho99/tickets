-- ============================================================
-- Migration 006: Multi-tenancy por empresa
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabla de empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. empresa_id en todas las tablas
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- 3. Backfill: crear empresa default y asignar datos existentes
DO $$
DECLARE v_eid UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE empresa_id IS NULL LIMIT 1) THEN
    INSERT INTO public.empresas (nombre)
    VALUES ('HuntersTrack')
    RETURNING id INTO v_eid;

    UPDATE public.profiles        SET empresa_id = v_eid WHERE empresa_id IS NULL;
    UPDATE public.tickets         SET empresa_id = v_eid WHERE empresa_id IS NULL;
    UPDATE public.projects        SET empresa_id = v_eid WHERE empresa_id IS NULL;
    UPDATE public.notifications   SET empresa_id = v_eid WHERE empresa_id IS NULL;
    UPDATE public.ticket_comments SET empresa_id = v_eid WHERE empresa_id IS NULL;
  END IF;
END $$;

-- 4. Función helper: empresa del usuario actual (SECURITY DEFINER bypasa RLS)
CREATE OR REPLACE FUNCTION public.get_my_empresa_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Trigger: auto-poblar empresa_id en INSERTs del cliente
CREATE OR REPLACE FUNCTION public.trg_set_empresa_id()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := (SELECT empresa_id FROM public.profiles WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_empresa_id ON public.tickets;
CREATE TRIGGER set_empresa_id
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_empresa_id();

DROP TRIGGER IF EXISTS set_empresa_id ON public.projects;
CREATE TRIGGER set_empresa_id
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_empresa_id();

DROP TRIGGER IF EXISTS set_empresa_id ON public.ticket_comments;
CREATE TRIGGER set_empresa_id
  BEFORE INSERT ON public.ticket_comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_empresa_id();

-- 6. RLS: empresas — solo ver la propia
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresas_select" ON public.empresas;
CREATE POLICY "empresas_select" ON public.empresas
  FOR SELECT USING (id = public.get_my_empresa_id());

-- 7. RLS: profiles — ver perfiles de la misma empresa o el propio
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR empresa_id = public.get_my_empresa_id()
  );

-- 8. RLS: tickets — solo de la misma empresa (reemplaza todas las existentes)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies
            WHERE tablename = 'tickets' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tickets', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "tickets_empresa" ON public.tickets
  FOR ALL USING (empresa_id = public.get_my_empresa_id())
  WITH CHECK (empresa_id = public.get_my_empresa_id());

-- 9. RLS: projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies
            WHERE tablename = 'projects' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "projects_empresa" ON public.projects
  FOR ALL USING (empresa_id = public.get_my_empresa_id())
  WITH CHECK (empresa_id = public.get_my_empresa_id());

-- 10. RLS: ticket_comments
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies
            WHERE tablename = 'ticket_comments' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ticket_comments', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "ticket_comments_empresa" ON public.ticket_comments
  FOR ALL USING (empresa_id = public.get_my_empresa_id())
  WITH CHECK (empresa_id = public.get_my_empresa_id());

-- 11. RLS: notifications — por usuario (empresa no necesaria, ya es 1-a-1)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- 12. Actualizar trigger de notificaciones para incluir empresa_id del ticket
CREATE OR REPLACE FUNCTION public.notify_on_ticket_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN

  IF TG_OP = 'INSERT' AND NEW.developer_id IS NOT NULL THEN
    INSERT INTO public.notifications
      (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo, empresa_id)
    VALUES (
      NEW.developer_id, 'Nueva tarea asignada', NEW.titulo,
      'ticket_asignado', NEW.id, 'ticket', NEW.empresa_id
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.developer_id IS DISTINCT FROM NEW.developer_id
     AND NEW.developer_id IS NOT NULL THEN
    INSERT INTO public.notifications
      (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo, empresa_id)
    VALUES (
      NEW.developer_id, 'Ticket asignado', NEW.titulo,
      'ticket_asignado', NEW.id, 'ticket', NEW.empresa_id
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.notifications
      (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo, empresa_id)
    VALUES (
      NEW.solicitante_id,
      'Ticket ' || CASE NEW.estado
        WHEN 'aprobado'    THEN 'Aprobado'
        WHEN 'en_progreso' THEN 'En Progreso'
        WHEN 'corregido'   THEN 'Corregido'
        WHEN 'cerrado'     THEN 'Cerrado'
        ELSE NEW.estado
      END,
      NEW.titulo, 'ticket_estado', NEW.id, 'ticket', NEW.empresa_id
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
