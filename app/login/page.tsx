import { isRacingStudioEnabled, isRacingStudioPreview } from "@/lib/racing-studio"
import { AuthScreen } from "@/components/screens/auth-screen"

function safeInternalNext(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return undefined
  return candidate
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; confirmation_error?: string }>
}) {
  const params = await searchParams
  return <AuthScreen racing={isRacingStudioEnabled()} preview={isRacingStudioPreview()} mode="login" nextPath={safeInternalNext(params.next)} confirmationError={params.confirmation_error === "1"} />
}
