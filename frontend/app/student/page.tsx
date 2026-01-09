'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { StudentSidebar } from '@/components/sidebars/StudentSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AttendanceScanner } from '@/components/attendance-scanner';
import {
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  User,
  Bell,
  AlertCircle,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  QrCode,
  Smartphone,
  Download,
  CreditCard,
  XCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

type AttendanceRecord = {
  _id: string;
  date: string;
  status: 'Present' | 'Absent';
  method: 'QR' | 'FACE';
  checkInTime?: string;
};

type FeeStatus = {
  monthlyFee: number;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Due' | 'Overdue';
  lastPaymentDate: string | null;
  nextDueDate: string;
};

type PaymentRecord = {
  _id: string;
  amount: number;
  date: string;
  mode: string;
  status: string;
};

export default function StudentDashboardPage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeStatus | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [attData, feeData, profileData, paymentData] = await Promise.all([
          api.getMyAttendance(),
          api.getMyFees(),
          api.getMyProfile(),
          api.getMyPayments(),
        ]);

        setAttendance(attData);
        setFees(feeData);
        setPayments(paymentData);
        if (profileData.role === 'Student') {
          setStudentProfile(profileData.student);
        }

        // Generate QR code for student ID
        if (profileData.student?.studentId) {
          const qrData = `STUDENT:${profileData.student.studentId}`;
          const dataUrl = await QRCode.toDataURL(qrData);
          setQrDataUrl(dataUrl);
        }

        // Check for notifications
        const notifs: string[] = [];
        if (feeData.paymentStatus === 'Overdue') {
          notifs.push('Your monthly fee is overdue. Please pay immediately to continue services.');
        }
        if (profileData.student?.status === 'Inactive') {
          notifs.push('Your membership is inactive. Please contact admin.');
        }
        setNotifications(notifs);

      } catch (e: any) {
        setError(e.message ?? 'Something went wrong loading your dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const presentCount = useMemo(
    () => attendance.filter((r) => r.status === 'Present').length,
    [attendance],
  );

  const totalDays = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = now;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, []);

  const monthlyPresent = useMemo(() => {
    const now = new Date();
    const thisMonth = attendance.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear() && r.status === 'Present';
    });
    return thisMonth.length;
  }, [attendance]);

  const attendancePercentage = useMemo(() => {
    return totalDays > 0 ? Math.round((monthlyPresent / totalDays) * 100) : 0;
  }, [monthlyPresent, totalDays]);

  const todayAttendance = useMemo(() => {
    const today = new Date().toDateString();
    return attendance.find((r) => new Date(r.date).toDateString() === today);
  }, [attendance]);

  const handleMarkAttendanceQr = () => {
    setIsScannerOpen(true);
  };

  const handleMarkAttendanceFace = async () => {
    // Mock face recognition for now
    try {
      // In real implementation, this would capture face and send to backend
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        await api.markAttendance({ faceMatch: true, location: { lat: 0, lng: 0, address: 'Face recognition' } });
        setAttendanceMarked(true);
        setTimeout(() => setAttendanceMarked(false), 3000);
        // Refresh attendance data
        const attData = await api.getMyAttendance();
        setAttendance(attData);
      } else {
        alert('Face not recognized. Please try again or use QR scan.');
      }
    } catch (e: any) {
      alert('Error marking attendance: ' + e.message);
    }
  };

  const handleDownloadReceipt = (payment: PaymentRecord) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Payment Receipt', 20, 30);
    doc.setFontSize(12);
    doc.text(`Student: ${studentProfile?.fullName}`, 20, 50);
    doc.text(`Student ID: ${studentProfile?.studentId}`, 20, 60);
    doc.text(`Amount: ₹${payment.amount}`, 20, 80);
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, 20, 90);
    doc.text(`Mode: ${payment.mode}`, 20, 100);
    doc.text(`Status: ${payment.status}`, 20, 110);
    doc.text('Thank you for your payment!', 20, 130);
    doc.save(`receipt-${payment._id}.pdf`);
  };

  const handlePayFees = async () => {
    if (!fees || fees.dueAmount === 0) return;

    // Mock payment for now
    try {
      await api.createPayment({
        student: studentProfile?._id,
        amount: fees.dueAmount,
        mode: 'Online',
        status: 'Fully Paid',
      });
      // Refresh data
      const [feeData, paymentData] = await Promise.all([
        api.getMyFees(),
        api.getMyPayments(),
      ]);
      setFees(feeData);
      setPayments(paymentData);
      alert('Payment successful!');
    } catch (e: any) {
      alert('Payment failed: ' + e.message);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <StudentSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
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
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-center mb-2">Error Loading Dashboard</h3>
                <p className="text-muted-foreground text-center">{error}</p>
                <Button className="w-full mt-4" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
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
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {studentProfile?.fullName || 'Student'}!
            </h1>
            <p className="text-muted-foreground">
              Here's your study activity & membership overview
            </p>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Important Notices</h4>
                    <ul className="mt-2 space-y-1">
                      {notifications.map((notif, index) => (
                        <li key={index} className="text-sm text-orange-800">• {notif}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Attendance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {todayAttendance ? (
                    <>
                      {todayAttendance.status === 'Present' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className={`text-lg font-bold ${todayAttendance.status === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                          {todayAttendance.status}
                        </div>
                        {todayAttendance.checkInTime && (
                          <p className="text-xs text-muted-foreground">
                            {todayAttendance.checkInTime}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-lg font-bold text-muted-foreground">Not Marked</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Attendance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Attendance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyPresent}</div>
                <p className="text-xs text-muted-foreground">
                  Present days this month
                </p>
                <div className="mt-2">
                  <Progress value={attendancePercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {attendancePercentage}% attendance rate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fee Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fee Status</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    fees?.paymentStatus === 'Paid' ? 'default' :
                    fees?.paymentStatus === 'Due' ? 'secondary' : 'destructive'
                  }>
                    {fees?.paymentStatus || 'Unknown'}
                  </Badge>
                </div>
                {fees?.dueAmount > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Due: ₹{fees.dueAmount}
                  </p>
                )}
                {fees?.nextDueDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Next due: {new Date(fees.nextDueDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Membership Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membership</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{studentProfile?.paymentPlan || 'Monthly'}</div>
                <p className="text-xs text-muted-foreground">
                  Valid till: {studentProfile?.membershipEnd ? new Date(studentProfile.membershipEnd).toLocaleDateString() : 'N/A'}
                </p>
                {studentProfile?.desk && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Desk: {studentProfile.desk}
                  </p>
                )}
                {studentProfile?.shift && (
                  <p className="text-xs text-muted-foreground">
                    Shift: {studentProfile.shift}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Attendance Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Mark Today's Attendance
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose your preferred method to mark attendance
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleMarkAttendanceQr}
                  disabled={!!todayAttendance}
                  className="h-24 flex-col gap-3 text-base"
                  size="lg"
                >
                  <QrCode className="h-8 w-8" />
                  <span>Scan QR Code</span>
                </Button>
                <Button
                  onClick={handleMarkAttendanceFace}
                  disabled={!!todayAttendance}
                  variant="outline"
                  className="h-24 flex-col gap-3 text-base"
                  size="lg"
                >
                  <Smartphone className="h-8 w-8" />
                  <span>Face Recognition</span>
                </Button>
                <Button
                  onClick={() => {
                    if (qrDataUrl) {
                      const link = document.createElement('a');
                      link.href = qrDataUrl;
                      link.download = `student-qr-${studentProfile?.studentId}.png`;
                      link.click();
                    }
                  }}
                  variant="outline"
                  className="h-24 flex-col gap-3 text-base"
                  size="lg"
                >
                  <Download className="h-8 w-8" />
                  <span>Generate My ID QR</span>
                </Button>
              </div>
              {attendanceMarked && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-medium">Attendance marked successfully!</p>
                  </div>
                </div>
              )}
              {todayAttendance && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    You've already marked attendance for today ({todayAttendance.status})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Recent Attendance Records
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your daily attendance history
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Check-in Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.slice(0, 10).map((record) => {
                      const isToday = new Date(record.date).toDateString() === new Date().toDateString();
                      return (
                        <TableRow key={record._id} className={isToday ? 'bg-blue-50' : ''}>
                          <TableCell className="font-medium">
                            {isToday && <Badge variant="outline" className="mr-2">Today</Badge>}
                            {new Date(record.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.method}</TableCell>
                          <TableCell>{record.checkInTime || 'N/A'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {attendance.length === 0 && (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance records found</p>
                  <p className="text-sm text-muted-foreground">Start by marking your attendance above</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fees & Payments Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fee Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Monthly Fee Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Fee</p>
                    <p className="text-2xl font-bold">₹{fees?.monthlyFee || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600">₹{fees?.amountPaid || 0}</p>
                  </div>
                </div>
                
                {fees?.dueAmount > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-900">Payment Due</p>
                        <p className="text-sm text-red-700">₹{fees.dueAmount} pending</p>
                      </div>
                      <Button onClick={handlePayFees} size="sm" className="bg-red-600 hover:bg-red-700">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  </div>
                )}

                {fees?.paymentStatus === 'Paid' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-green-800 font-medium">All fees paid for this month</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">₹{payment.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()} • {payment.mode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={payment.status === 'Fully Paid' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReceipt(payment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {payments.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payment records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* QR Scanner Dialog */}
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code for Attendance</DialogTitle>
            </DialogHeader>
            <AttendanceScanner
              onScanSuccess={async (data) => {
                try {
                  await api.markAttendance({ location: { lat: 0, lng: 0, address: 'Scanned' } });
                  setAttendanceMarked(true);
                  setIsScannerOpen(false);
                  setTimeout(() => setAttendanceMarked(false), 3000);
                  // Refresh attendance data
                  const attData = await api.getMyAttendance();
                  setAttendance(attData);
                } catch (e: any) {
                  alert('Error marking attendance: ' + e.message);
                }
              }}
              onScanError={(error) => {
                console.error('Scan error:', error);
              }}
            />
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}