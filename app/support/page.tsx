import { AppPage } from "@/components/app-page"
import { SupportScreen } from "@/components/screens/support-screen"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  return (
    <AppPage>
      <SupportScreen
        initialCategory={first(params.category)}
        initialQuery={first(params.query)}
        initialRequestId={first(params.request)}
      />
    </AppPage>
  )
}
