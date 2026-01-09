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
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, FileText, CreditCard, Download } from 'lucide-react';
import jsPDF from 'jspdf';

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

export default function StudentFeesPage() {
  const [fees, setFees] = useState<FeeStatus | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [feeData, paymentData, profileData] = await Promise.all([
          api.getMyFees(),
          api.getMyPayments(),
          api.getMyProfile(),
        ]);

        setFees(feeData);
        setPayments(paymentData);
        if (profileData.role === 'Student') {
          setStudentProfile(profileData.student);
        }
      } catch (e: any) {
        setError(e.message ?? 'Something went wrong loading fees');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
              <p className="mt-2 text-muted-foreground">Loading fees...</p>
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
            <Card className="w-full max-w-md mx-auto mt-8">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Error Loading Fees</h3>
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
                <BreadcrumbPage>Fees & Payments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Fee Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Fee</p>
                  <p className="text-2xl font-bold">₹{fees?.monthlyFee}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-2xl font-bold text-green-600">₹{fees?.amountPaid}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Amount</p>
                  <p className="text-2xl font-bold text-red-600">₹{fees?.dueAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={
                    fees?.paymentStatus === 'Paid' ? 'default' :
                    fees?.paymentStatus === 'Due' ? 'secondary' : 'destructive'
                  }>
                    {fees?.paymentStatus}
                  </Badge>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={handlePayFees} disabled={fees?.dueAmount === 0} className="w-full md:w-auto">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now (₹{fees?.dueAmount})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History & Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>₹{payment.amount}</TableCell>
                      <TableCell>{payment.mode}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'Fully Paid' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(payment)}>
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {payments.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No payment records found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}