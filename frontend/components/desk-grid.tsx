"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Desk {
  _id: string
  deskNumber: string
  type: "Single" | "Shared"
  status: "Available" | "Occupied"
  assignedStudent?: { fullName: string }
}

export function DeskGrid({ desks }: { desks: Desk[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {desks.map((desk) => (
        <Card
          key={desk._id}
          className={cn(
            "transition-all hover:ring-2 hover:ring-primary/20",
            desk.status === "Occupied" ? "bg-muted/50" : "bg-card",
          )}
        >
          <CardHeader className="p-3 pb-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">#{desk.deskNumber}</span>
              <Badge variant={desk.status === "Available" ? "default" : "outline"} className="h-5 px-1.5 text-[10px]">
                {desk.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{desk.type}</span>
              <span className="text-[11px] truncate text-muted-foreground">
                {desk.assignedStudent?.fullName || "Empty"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
