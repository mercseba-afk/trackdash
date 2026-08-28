import { AppPage } from "@/components/app-page"
import { ProfileScreen } from "@/components/screens/profile-screen"

// Settings shares the same account surface as the profile view. The profile
// screen already exposes preferences (theme, currency, notifications) alongside
// identity, so both entry points resolve to one cohesive account page.
export default function SettingsPage() {
  return (
    <AppPage>
      <ProfileScreen />
    </AppPage>
  )
}
