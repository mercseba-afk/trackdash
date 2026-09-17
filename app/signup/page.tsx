import { AuthScreen } from "@/components/screens/auth-screen"

function safeInternalNext(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return undefined
  return candidate
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const params = await searchParams
  return <AuthScreen mode="signup" nextPath={safeInternalNext(params.next)} />
}
