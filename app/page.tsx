import { AppPage } from "@/components/app-page"
import { DashboardDataGate } from "@/components/dashboard-data-gate"
import { DashboardScreen } from "@/components/screens/dashboard-screen"

export default function Page() {
  return (
    <AppPage>
      <DashboardDataGate>
        <DashboardScreen />
      </DashboardDataGate>
    </AppPage>
  )
}
