-- Trigger automático de notificaciones en tickets
-- Ejecutar en: Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.notify_on_ticket_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN

  -- INSERT: ticket creado con developer asignado
  IF TG_OP = 'INSERT' AND NEW.developer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
    VALUES (
      NEW.developer_id,
      'Nueva tarea asignada',
      NEW.titulo,
      'ticket_asignado',
      NEW.id,
      'ticket'
    );
    RETURN NEW;
  END IF;

  -- UPDATE: developer_id cambia (reasignación)
  IF TG_OP = 'UPDATE' AND OLD.developer_id IS DISTINCT FROM NEW.developer_id
     AND NEW.developer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
    VALUES (
      NEW.developer_id,
      'Ticket asignado',
      NEW.titulo,
      'ticket_asignado',
      NEW.id,
      'ticket'
    );
  END IF;

  -- UPDATE: estado cambia → notificar al solicitante
  IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.notifications (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
    VALUES (
      NEW.solicitante_id,
      'Ticket ' || CASE NEW.estado
        WHEN 'aprobado'    THEN 'Aprobado'
        WHEN 'en_progreso' THEN 'En Progreso'
        WHEN 'corregido'   THEN 'Corregido'
        WHEN 'cerrado'     THEN 'Cerrado'
        ELSE NEW.estado
      END,
      NEW.titulo,
      'ticket_estado',
      NEW.id,
      'ticket'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ticket_notify_trigger ON public.tickets;
CREATE TRIGGER ticket_notify_trigger
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_change();
