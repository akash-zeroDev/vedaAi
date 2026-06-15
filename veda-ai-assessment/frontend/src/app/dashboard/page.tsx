import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutList,
  FileText,
  BarChart2,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Zap,
  Target,
  BookOpenCheck,
} from 'lucide-react';
import { connectToDatabase } from '@/lib/mongoose';
import mongoose from 'mongoose';
import Analysis from '@/lib/models/Analysis';
import Rubric from '@/lib/models/Rubric';
import Summary from '@/lib/models/Summary';
import Assignment from '@/lib/models/Assignment';
import type { IActivityLog, ToolName, ActivityStatus } from '@/lib/models/ActivityLog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: string | number;
  trend: string;
  positive: boolean;
  icon: React.ReactNode;
}

interface RecentItem {
  id: string;
  toolName: ToolName;
  assignmentTitle: string;
  status: ActivityStatus;
  href: string;
  createdAt: Date;
}

interface DashboardStats {
  totalAnalyses: number;
  totalRubrics: number;
  totalSummaries: number;
  totalAssignments: number;
  totalGenerations: number;
  totalTokensUsed: number;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

/**
 * Fetches aggregate high-level stats for the authenticated user.
 *
 * PRODUCTION NOTE: In production this should be backed by a Redis cache
 * (e.g. Upstash) keyed on `dashboard:stats:{userId}` with a 60-second TTL
 * to guarantee sub-10ms response times on repeat page loads.
 *
 * Pattern:
 *   const cached = await redis.get(`dashboard:stats:${userId}`);
 *   if (cached) return JSON.parse(cached);
 *   const fresh = await computeFromMongo(userId);
 *   await redis.set(`dashboard:stats:${userId}`, JSON.stringify(fresh), { ex: 60 });
 *   return fresh;
 */
async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  await connectToDatabase();
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [analysesStats, rubricsStats, summariesStats, assignmentsStats] = await Promise.all([
    Analysis.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, count: { $sum: 1 }, tokens: { $sum: '$tokenUsage' } } }
    ]),
    Rubric.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, count: { $sum: 1 }, tokens: { $sum: '$tokenUsage' } } }
    ]),
    Summary.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: null, count: { $sum: 1 }, tokens: { $sum: '$tokenUsage' } } }
    ]),
    Assignment.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, tokens: { $sum: '$tokenUsage' } } }
    ])
  ]);

  const totalAnalyses = analysesStats[0]?.count || 0;
  const totalRubrics = rubricsStats[0]?.count || 0;
  const totalSummaries = summariesStats[0]?.count || 0;
  const totalAssignments = assignmentsStats[0]?.count || 0;
  
  const totalTokensUsed = 
    (analysesStats[0]?.tokens || 0) + 
    (rubricsStats[0]?.tokens || 0) + 
    (summariesStats[0]?.tokens || 0) +
    (assignmentsStats[0]?.tokens || 0);

  return {
    totalAnalyses,
    totalRubrics,
    totalSummaries,
    totalAssignments,
    totalGenerations: totalAnalyses + totalRubrics + totalSummaries + totalAssignments,
    totalTokensUsed,
  };
}

/**
 * Fetches the 10 most recent completed tool runs across all tools.
 * Merges, sorts, and slices in-memory to avoid a separate ActivityLog
 * collection until it's wired up. Uses a lean() projection for speed.
 *
 * PRODUCTION NOTE: Replace with:
 *   ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(10).lean()
 */
async function fetchRecentActivity(userId: string): Promise<RecentItem[]> {
  await connectToDatabase();

  const [analyses, rubrics, summaries, assignments] = await Promise.all([
    Analysis.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status createdAt')
      .lean(),
    Rubric.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status createdAt')
      .lean(),
    Summary.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status createdAt')
      .lean(),
    Assignment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status createdAt')
      .lean(),
  ]);

  const items: RecentItem[] = [
    ...analyses.map((a) => ({
      id: (a._id as any).toString(),
      toolName: 'Difficulty Analyzer' as ToolName,
      assignmentTitle: (a as any).title || 'Untitled Analysis',
      status: (a as any).status as ActivityStatus,
      href: `/dashboard/toolkit/difficulty-analyzer?id=${(a._id as any).toString()}`,
      createdAt: (a as any).createdAt,
    })),
    ...rubrics.map((r) => ({
      id: (r._id as any).toString(),
      toolName: 'Rubric Generator' as ToolName,
      assignmentTitle: (r as any).title || 'Untitled Rubric',
      status: (r as any).status as ActivityStatus,
      href: `/dashboard/toolkit/rubric-generator?id=${(r._id as any).toString()}`,
      createdAt: (r as any).createdAt,
    })),
    ...summaries.map((s) => ({
      id: (s._id as any).toString(),
      toolName: 'Lesson Summarizer' as ToolName,
      assignmentTitle: (s as any).title || 'Untitled Summary',
      status: (s as any).status as ActivityStatus,
      href: `/dashboard/toolkit/lesson-summary?id=${(s._id as any).toString()}`,
      createdAt: (s as any).createdAt,
    })),
    ...assignments.map((a) => ({
      id: (a._id as any).toString(),
      toolName: 'Assignment Generator' as ToolName,
      assignmentTitle: (a as any).title || 'Untitled Assignment',
      status: ((a as any).status || 'completed').toUpperCase() as ActivityStatus,
      href: `/dashboard/output/${(a._id as any).toString()}`,
      createdAt: (a as any).createdAt,
    })),

  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TOOL_BADGE_STYLES: Record<ToolName, string> = {
  'Rubric Generator': 'bg-indigo-50 border-indigo-100 text-indigo-700',
  'Difficulty Analyzer': 'bg-amber-50 border-amber-100 text-amber-700',
  'Lesson Summarizer': 'bg-emerald-50 border-emerald-100 text-emerald-700',
  'Assignment Generator': 'bg-blue-50 border-blue-100 text-blue-700',
};

// ─── Sub-components (inline, no separate file needed at this scale) ───────────

function StatusDot({ status }: { status: ActivityStatus }) {
  if (status === 'COMPLETED')
    return (
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs text-slate-500">Completed</span>
      </span>
    );
  if (status === 'PROCESSING')
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs text-slate-500">Processing</span>
      </span>
    );
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-red-400" />
      <span className="text-xs text-slate-500">Failed</span>
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth');

  const userId = (session.user as any).id as string;
  const [stats, recentActivity] = await Promise.all([
    fetchDashboardStats(userId),
    fetchRecentActivity(userId),
  ]);

  const firstName = session.user.name?.split(' ')[0] ?? 'there';

  // AI Credits — 1M token cap for the platform UI
  const AI_TOKEN_CAP = 1000000;
  const aiTokensUsed = Math.min(stats.totalTokensUsed, AI_TOKEN_CAP);
  const quotaPct = Math.round((aiTokensUsed / AI_TOKEN_CAP) * 100);

  // Helper to format large numbers
  const formatCompact = (num: number) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);

  const statCards: StatCard[] = [
    {
      label: 'Total Generations',
      value: stats.totalGenerations,
      trend: '+12% this week',
      positive: true,
      icon: <Zap size={14} className="text-slate-400" />,
    },
    {
      label: 'Rubrics Created',
      value: stats.totalRubrics,
      trend: '+3 this month',
      positive: true,
      icon: <LayoutList size={14} className="text-slate-400" />,
    },
    {
      label: 'Analyses Run',
      value: stats.totalAnalyses,
      trend: '+5 this month',
      positive: true,
      icon: <Target size={14} className="text-slate-400" />,
    },
    {
      label: 'Lesson Summaries',
      value: stats.totalSummaries,
      trend: 'No change',
      positive: false,
      icon: <BookOpenCheck size={14} className="text-slate-400" />,
    },
    {
      label: 'Assignments Created',
      value: stats.totalAssignments,
      trend: '+2 this week',
      positive: true,
      icon: <FileText size={14} className="text-slate-400" />,
    },
  ];

  const quickLaunch = [
    {
      id: 'rubric',
      icon: <LayoutList size={18} className="text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      title: 'Generate Rubric',
      description: 'AI-crafted grading matrices for any assignment in seconds.',
      href: '/dashboard/toolkit/rubric-generator',
    },
    {
      id: 'summary',
      icon: <FileText size={18} className="text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      title: 'Summarize Lesson',
      description: 'Upload a PDF — get themes, vocab, and an exec summary.',
      href: '/dashboard/toolkit/lesson-summary',
    },
    {
      id: 'analyzer',
      icon: <BarChart2 size={18} className="text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      title: 'Analyze Difficulty',
      description: 'Map cognitive load across your question set visually.',
      href: '/dashboard/toolkit/difficulty-analyzer',
    },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full max-w-[1280px] mx-auto gap-8 pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
            {formatDate()}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here&apos;s your workspace at{' '}
            <span className="font-medium text-slate-700 capitalize">
              {session.user.schoolName ?? 'your school'}
            </span>
            .
          </p>
        </div>

        {/* Usage Quota */}
        <div className="shrink-0 bg-white border border-slate-200 rounded-2xl px-5 py-4 flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tokens
            </span>
            <span className="text-xs font-mono font-semibold text-slate-800">
              {formatCompact(aiTokensUsed)}
              <span className="text-slate-400 font-normal"> / {formatCompact(AI_TOKEN_CAP)}</span>
            </span>
          </div>
          {/* Progress track */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0B132B] rounded-full transition-all duration-700"
              style={{ width: `${Math.max(quotaPct, 1)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {formatCompact(AI_TOKEN_CAP - aiTokensUsed)} tokens remaining this month
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-2xl px-5 py-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                {card.label}
              </span>
              {card.icon}
            </div>
            <span className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
              {card.value}
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp
                size={11}
                className={card.positive ? 'text-emerald-500' : 'text-slate-300'}
              />
              <span
                className={`text-[11px] font-medium ${
                  card.positive ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {card.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Launch Bento ── */}
      <div>
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Quick Launch
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLaunch.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200 overflow-hidden"
            >
              {/* Hover arrow top-right */}
              <ArrowUpRight
                size={15}
                className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-slate-500 transition-all duration-200 -translate-y-0.5 translate-x-0.5 group-hover:translate-y-0 group-hover:translate-x-0"
              />

              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${tool.iconBg}`}>
                {tool.icon}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{tool.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-slate-700 transition-colors mt-auto">
                Open
                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Activity Ledger ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Recent Activity
          </h2>
          <Link
            href="/dashboard/toolkit"
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-0.5 transition-colors"
          >
            View all tools <ChevronRight size={11} />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Zap size={28} strokeWidth={1.5} />
              <p className="text-sm font-medium">No activity yet</p>
              <p className="text-xs text-slate-400">Run your first tool to see results here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="text-left py-3 px-5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Tool
                    </th>
                    <th className="text-left py-3 px-5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Assignment title
                    </th>
                    <th className="text-left py-3 px-5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left py-3 px-5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      When
                    </th>
                    <th className="py-3 px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((item) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-slate-50/60 transition-colors duration-100"
                    >
                      {/* Tool badge */}
                      <td className="py-3.5 px-5 whitespace-nowrap align-middle">
                        <span
                          className={`inline-block text-[10px] font-semibold uppercase tracking-wider border px-2 py-0.5 rounded ${
                            TOOL_BADGE_STYLES[item.toolName]
                          }`}
                        >
                          {item.toolName}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-5 align-middle max-w-[260px]">
                        <span className="font-medium text-slate-800 truncate block">
                          {item.assignmentTitle}
                        </span>
                      </td>

                      {/* Status dot */}
                      <td className="py-3.5 px-5 whitespace-nowrap align-middle">
                        <StatusDot status={item.status} />
                      </td>

                      {/* Relative time */}
                      <td className="py-3.5 px-5 whitespace-nowrap align-middle">
                        <span className="text-xs text-slate-400 tabular-nums">
                          {relativeTime(item.createdAt)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 align-middle text-right">
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-800 border border-transparent hover:border-slate-200 rounded-lg px-2.5 py-1 transition-all duration-150"
                        >
                          View <ChevronRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
