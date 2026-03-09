import { redirect } from "next/navigation"

export const runtime = 'nodejs'

export default function DashboardIndexPage() {
  redirect("/dashboard/overview")
}

