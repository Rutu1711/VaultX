"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DataPoint = {
  month: string;
  incoming: number;
  outgoing: number;
  cardSpend: number;
  net: number;
};

export default function SpendingChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incoming" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outgoing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cardSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="month" stroke="#a1a1aa" />
          <YAxis stroke="#a1a1aa" tickFormatter={(tick) => `$${tick}`} />
          <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
          <Area type="monotone" dataKey="incoming" name="Incoming" stroke="#22c55e" fillOpacity={1} fill="url(#incoming)" />
          <Area type="monotone" dataKey="outgoing" name="Outgoing" stroke="#f97316" fillOpacity={1} fill="url(#outgoing)" />
          <Area type="monotone" dataKey="cardSpend" name="Card spend" stroke="#3b82f6" fillOpacity={1} fill="url(#cardSpend)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


