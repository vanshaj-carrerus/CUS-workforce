"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const BRAND = "#4338ca";
const SUCCESS = "#059669";
const WARNING = "#d97706";
const INFO = "#2563eb";
const VIOLET = "#7c3aed";
const DANGER = "#dc2626";
const PIE_COLORS = [BRAND, SUCCESS, INFO, WARNING, VIOLET, DANGER];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e6e8f0",
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
};
const axisStyle = { fontSize: 12, fill: "#64748b" };

export function HeadcountChart({ data }: { data: { month: string; headcount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="headcountFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#eef0f4" />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={38} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="headcount" stroke={BRAND} strokeWidth={2.5} fill="url(#headcountFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AttendanceTrendChart({ data }: { data: { month: string; rate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#eef0f4" />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={38} domain={[80, 100]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="rate" stroke={SUCCESS} strokeWidth={2.5} dot={{ r: 3, fill: SUCCESS }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LeaveTrendChart({ data }: { data: { month: string; days: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#eef0f4" />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={38} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="days" fill={VIOLET} radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DepartmentDonutChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: "#0f172a" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HiringAttritionChart({ data }: { data: { month: string; hires: number; attrition: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#eef0f4" />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={38} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 12, color: "#0f172a" }}>{value}</span>} />
        <Bar dataKey="hires" name="Hires" fill={INFO} radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="attrition" name="Attrition" fill={DANGER} radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
