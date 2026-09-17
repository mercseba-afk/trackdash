import { AuthGate } from "@/components/auth-gate"
import { OnboardingScreen } from "@/components/screens/onboarding-screen"

function safeInternalNext(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return undefined
  return candidate
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const params = await searchParams

  return (
    <AuthGate>
      <OnboardingScreen nextPath={safeInternalNext(params.next)} />
    </AuthGate>
  )
}
