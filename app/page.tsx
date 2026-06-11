"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { LoginScreen } from "@/components/dashboard/login-screen"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

function AppContent() {
  const { user } = useAuth()

  if (!user) {
    return <LoginScreen />
  }

  return <DashboardLayout />
}

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
