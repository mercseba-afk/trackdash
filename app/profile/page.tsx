import { AppPage } from "@/components/app-page"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { PushPilot } from "@/components/push-pilot"
import { getPushPilotKey } from "@/lib/actions/push-pilot"

export default async function ProfilePage() {
  const pushPilotKey = await getPushPilotKey()
  return (
    <AppPage>
      <ProfileScreen />
      {pushPilotKey && <PushPilot publicKey={pushPilotKey} />}
    </AppPage>
  )
}
