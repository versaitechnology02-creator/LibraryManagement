'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StudentSidebar } from '@/components/sidebars/StudentSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';

type AttendanceRecord = {
  _id: string;
  date: string;
  status: 'Present' | 'Absent';
  method: 'QR' | 'FACE';
  checkInTime?: string;
};

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const attData = await api.getMyAttendance();
        setAttendance(attData);
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong loading attendance');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <SidebarProvider>
        <StudentSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading attendance...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <StudentSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Error Loading Attendance</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <StudentSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Attendance</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Attendance Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Click on any date to view attendance details
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
                <div>
                  <h4 className="font-semibold mb-4">Attendance Details</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {attendance
                      .filter((record) => {
                        if (!selectedDate) return true;
                        return new Date(record.date).toDateString() === selectedDate.toDateString();
                      })
                      .map((record) => (
                        <div key={record._id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">
                              Method: {record.method} | Time: {record.checkInTime || 'N/A'}
                            </p>
                          </div>
                          <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                    {attendance.filter((record) => {
                      if (!selectedDate) return true;
                      return new Date(record.date).toDateString() === selectedDate.toDateString();
                    }).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No attendance records for selected date</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}