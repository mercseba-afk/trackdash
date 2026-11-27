import { AppShell } from "@/components/app-shell"
import { AuthGate } from "@/components/auth-gate"
import { MessagesScreenV2 } from "@/components/screens/messages-screen-v2"

export default function HotWheelsMessagesPage() {
  return (
    <AuthGate>
      <AppShell vertical="hotwheels">
        <MessagesScreenV2 universe="hotwheels" />
      </AppShell>
    </AuthGate>
  )
}
