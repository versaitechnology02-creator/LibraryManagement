"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface Shift {
  _id: string
  name: string
  startTime: string
  endTime: string
  maxCapacity: number
  currentCount: number
}

export function ShiftManager({ shifts }: { shifts: Shift[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif">Shift Occupancy</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {shifts.map((shift) => {
          const percentage = (shift.currentCount / shift.maxCapacity) * 100
          return (
            <div key={shift._id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{shift.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({shift.startTime} - {shift.endTime})
                  </span>
                </div>
                <Badge variant={percentage > 90 ? "destructive" : "secondary"}>
                  {shift.currentCount}/{shift.maxCapacity}
                </Badge>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
