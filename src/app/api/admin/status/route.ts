import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin"

// Lightweight check used by the header to decide whether to show the admin link.
export async function GET() {
  const admin = await getAdminUser()
  return NextResponse.json({ admin: !!admin })
}
