import { notFound } from "next/navigation"
import { AppPage } from "@/components/app-page"
import { AdminScreen } from "@/components/screens/admin-screen"
import { getCurrentAdmin } from "@/lib/admin/access"
import { getAdminDashboardData } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const admin = await getCurrentAdmin()
  if (!admin) notFound()

  const data = await getAdminDashboardData()

  return (
    <AppPage>
      <AdminScreen initialData={data} />
    </AppPage>
  )
}
