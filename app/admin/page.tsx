import Link from "next/link"
import { canAccessSpeedChampions } from "@/lib/server/speed-champions-gate"
import { notFound, redirect } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { AdminScreen } from "@/components/screens/admin-screen"
import { getCurrentAdminAccessState } from "@/lib/admin/access"
import { getAdminDashboardData } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const access = await getCurrentAdminAccessState()
  if (!access.user) notFound()
  if (!access.aal2) redirect("/mfa?next=%2Fadmin")

  const data = await getAdminDashboardData()
  const showSpeedChampions = await canAccessSpeedChampions()

  return (
    <AppPage>
      {showSpeedChampions && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <Link href="/speed-champions/catalog" className="font-semibold text-blue-800 hover:underline">
            LEGO Speed Champions · anteprima privata
          </Link>
          <p className="mt-1 text-sm text-slate-600">Catalogo e dati di mercato, accessibili solo al tuo account.</p>
        </div>
      )}
      <AdminScreen initialData={data} />
    </AppPage>
  )
}
