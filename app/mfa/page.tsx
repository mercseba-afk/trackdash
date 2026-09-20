import { MfaScreen } from "@/components/screens/mfa-screen"

function safeInternalNext(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return "/dashboard"
  return candidate
}

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const params = await searchParams
  return <MfaScreen nextPath={safeInternalNext(params.next)} />
}
