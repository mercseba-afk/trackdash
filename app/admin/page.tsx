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

  return (
    <AppPage>
      <AdminScreen initialData={data} />
    </AppPage>
  )
}
