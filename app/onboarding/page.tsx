import { AuthGate } from "@/components/auth-gate"
import { OnboardingScreen } from "@/components/screens/onboarding-screen"

export default function OnboardingPage() {
  return (
    <AuthGate>
      <OnboardingScreen />
    </AuthGate>
  )
}
