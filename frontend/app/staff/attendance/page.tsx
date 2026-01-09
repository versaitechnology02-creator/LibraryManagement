'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StaffSidebar } from '@/components/sidebars/StaffSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle, XCircle } from 'lucide-react';

type AttendanceRecord = {
  _id: string;
  date: string;
  status: 'Present' | 'Absent';
};

export default function StaffAttendancePage() {
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

  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendance.find(record => record.date === dateStr);
  };

  const getAttendanceStatus = (date: Date) => {
    const record = getAttendanceForDate(date);
    return record?.status;
  };

  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(r => r.status === 'Present').length,
    absent: attendance.filter(r => r.status === 'Absent').length,
  };

  if (loading) {
    return (
      <SidebarProvider>
        <StaffSidebar />
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
        <StaffSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <Card className="w-full max-w-md mx-auto mt-8">
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
      <StaffSidebar />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Days</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present Days</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    present: attendance
                      .filter(r => r.status === 'Present')
                      .map(r => new Date(r.date)),
                    absent: attendance
                      .filter(r => r.status === 'Absent')
                      .map(r => new Date(r.date)),
                  }}
                  modifiersStyles={{
                    present: { backgroundColor: 'rgb(34, 197, 94)', color: 'white' },
                    absent: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Selected Date:</p>
                      <p className="text-lg">{selectedDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status:</p>
                      {getAttendanceStatus(selectedDate) ? (
                        <Badge variant={getAttendanceStatus(selectedDate) === 'Present' ? 'default' : 'destructive'}>
                          {getAttendanceStatus(selectedDate)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No Record</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select a date to view attendance details</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}