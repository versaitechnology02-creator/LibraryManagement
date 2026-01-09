"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSessionClient } from "@/lib/auth-client"
import { AttendanceEntry } from "./attendance-entry"

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const session = await getSessionClient()

      if (!session) {
        router.push("/login?redirect=/attendance")
        return
      }

      if (session.user.role === "Admin") {
        router.push("/dashboard")
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

  return <AttendanceEntry />
}
