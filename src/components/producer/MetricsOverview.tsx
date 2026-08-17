import React from 'react';
import { DollarSign, Percent, Briefcase, Tickets, TrendingUp } from 'lucide-react';

interface MetricsOverviewProps {
  totalGrossRevenue: number;
  producerShare: number;
  hubShare: number;
  totalSalesCount: number;
}

export default function MetricsOverview({
  totalGrossRevenue,
  producerShare,
  hubShare,
  totalSalesCount,
}: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="producer-metrics-overview">
      {/* CARD 1: GROSS SALES */}
      <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-sky-deep shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">
            GROSS TICKETS REVENUE
          </span>
          <div className="h-8 w-8 rounded-lg bg-sky-deep/10 border border-sky-deep/20 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-sky-light" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl md:text-2xl font-black font-mono text-white">
            GH₵{totalGrossRevenue.toLocaleString()}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            100% of marketplace volume
          </p>
        </div>
      </div>

      {/* CARD 2: PRODUCER SHARE (80%) */}
      <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-gold shadow-md gold-glow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] md:text-xs text-gold-light font-mono tracking-wider font-semibold">
            YOUR EARNINGS (80%)
          </span>
          <div className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Percent className="h-4 w-4 text-gold" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl md:text-2xl font-black font-mono text-gold-light">
            GH₵{producerShare.toLocaleString()}
          </h3>
          <p className="text-[10px] text-gold/60 mt-1 font-medium">
            Direct Paystack split payouts
          </p>
        </div>
      </div>

      {/* CARD 3: HUB SHARE (20%) */}
      <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-white/20 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">
            HUB COMMISSION (20%)
          </span>
          <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl md:text-2xl font-black font-mono text-gray-300">
            GH₵{hubShare.toLocaleString()}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">
            Sent to ETH (Event Ticket Hub) platform
          </p>
        </div>
      </div>

      {/* CARD 4: TICKETS SOLD */}
      <div className="rounded-2xl glass-panel p-4 md:p-6 border-l-4 border-l-emerald-500 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[10px] md:text-xs text-gray-400 font-mono tracking-wider font-medium">
            PREMIER ADMISSIONS
          </span>
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Tickets className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-xl md:text-2xl font-black font-mono text-white">
            {totalSalesCount} <span className="text-xs text-gray-500 font-normal">tickets</span>
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">
            Live gate validation-ready passes
          </p>
        </div>
      </div>
    </div>
  );
}
