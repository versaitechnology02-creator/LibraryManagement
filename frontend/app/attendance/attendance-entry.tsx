"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AttendanceScanner } from "@/components/attendance-scanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AttendanceEntry() {
  const router = useRouter()
  const [hasResult, setHasResult] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center font-serif text-2xl">Library Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Scan the library QR code and allow location access to mark your attendance. Staff members will be asked to
              verify their face after scanning.
            </p>
            <AttendanceScanner
              onCompleted={() => {
                setHasResult(true)
              }}
            />
            {hasResult && (
              <div className="pt-2 flex justify-center">
                <Button variant="outline" onClick={() => router.push("/")}>
                  Go to my dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


