"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, CreditCard, Clock, ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface PaymentStats {
  totalRevenue: number
  pendingAmount: number
  recentTransactionsCount: number
  paymentEfficiency: number
}

export function PaymentSummary({ stats }: { stats: PaymentStats }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm transition-all hover:shadow-md dark:from-emerald-950/20 dark:to-emerald-900/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
            Total Revenue
          </CardTitle>
          <div className="rounded-full bg-emerald-500/10 p-2">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold font-serif text-emerald-900 dark:text-emerald-100">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <ArrowUpIcon className="h-3 w-3" />
            <span>+12.5% from last month</span>
          </div>
        </CardContent>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
      </Card>

      {/* Pending Dues */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-red-100/50 shadow-sm transition-all hover:shadow-md dark:from-red-950/20 dark:to-red-900/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">
            Outstanding Dues
          </CardTitle>
          <div className="rounded-full bg-red-500/10 p-2">
            <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold font-serif text-red-900 dark:text-red-100">
            {formatCurrency(stats.pendingAmount)}
          </div>
          <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <ArrowDownIcon className="h-3 w-3" />
            <span>From {Math.floor(stats.pendingAmount / 500)} active students</span>
          </div>
        </CardContent>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />
      </Card>

      {/* Recent Transactions */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm transition-all hover:shadow-md dark:from-blue-950/20 dark:to-blue-900/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
            Today's Payments
          </CardTitle>
          <div className="rounded-full bg-blue-500/10 p-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold font-serif text-blue-900 dark:text-blue-100">
            {stats.recentTransactionsCount}
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
            <ArrowUpIcon className="h-3 w-3" />
            <span>Transactions processed</span>
          </div>
        </CardContent>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
      </Card>

      {/* Payment Efficiency */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-sm transition-all hover:shadow-md dark:from-amber-950/20 dark:to-amber-900/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
            Collection Rate
          </CardTitle>
          <div className="rounded-full bg-amber-500/10 p-2">
            <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-100">
            {stats.paymentEfficiency}%
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <span>Target: 95% efficiency</span>
          </div>
        </CardContent>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
      </Card>
    </div>
  )
}
