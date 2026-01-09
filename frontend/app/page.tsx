"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSessionClient } from "@/lib/auth-client"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const session = await getSessionClient()

      if (!session) {
        router.push("/login")
        return
      }

      if (session.user.role === "Admin") {
        router.push("/dashboard")
      } else if (session.user.role === "Student") {
        router.push("/student")
      } else if (session.user.role === "Staff") {
        router.push("/staff")
      } else {
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
}
