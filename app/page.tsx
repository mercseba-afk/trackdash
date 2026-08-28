import { AppShell } from "@/components/app-shell"
import { AuthGate } from "@/components/auth-gate"
import { DashboardScreen } from "@/components/screens/dashboard-screen"

export default function Page() {
  return (
    <AuthGate>
      <AppShell>
        <DashboardScreen />
      </AppShell>
    </AuthGate>
  )
}
