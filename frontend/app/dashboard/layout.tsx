"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSessionClient } from "@/lib/auth-client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const session = await getSessionClient()

      if (!session) {
        router.push("/login")
        return
      }

      if (session.user.role !== "Admin") {
        if (session.user.role === "Student") {
          router.push("/student")
        } else if (session.user.role === "Staff") {
          router.push("/staff")
        } else {
          router.push("/login")
        }
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
