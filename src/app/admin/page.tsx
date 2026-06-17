import { notFound } from "next/navigation"
import { getAdminUser } from "@/lib/admin"
import { AdminDashboard } from "./dashboard"

// Admin-only cache management. Non-admins (and anonymous visitors) get a 404 so
// the route's existence isn't revealed.
export default async function AdminPage() {
  const admin = await getAdminUser()
  if (!admin) notFound()
  return <AdminDashboard email={admin.email} />
}
