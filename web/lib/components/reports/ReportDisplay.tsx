"use client";

import { useMemo, useState } from "react";
import { Chip } from "@heroui/react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import {
  IconTag,
  IconAlertTriangle,
  IconBulb,
  IconTrendingUp,
  IconClock,
  IconChecklist,
  IconPercentage,
  IconTerminal2,
  IconTrash,
  IconCalendarStats,
  IconChartLine,
} from "@tabler/icons-react";
import { StatCard } from "@/lib/components/analytics/StatCard";
import dayjs from "@/lib/dates";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface IssueCategory {
  category: string;
  count: number;
  taskIds: string[];
  sessionIds: string[];
}

interface FrequencyEntry {
  term: string;
  count: number;
}

interface TemporalGroup {
  startDate: number;
  endDate: number;
  taskCount: number;
  sessionCount: number;
}

interface WorkPatterns {
  avgTaskDuration?: number;
  avgSessionMessages: number;
  statusDistribution: {
    todo: number;
    in_progress: number;
    business_review: number;
    code_review: number;
    done: number;
  };
  runSuccessRate: number;
}

interface IssuesByDateEntry {
  date: number;
  granularity: "day" | "week" | "month";
  issues: { category: string; count: number }[];
  totalItems: number;
}

interface DailyBreakdown {
  date: number;
  taskCount: number;
  sessionCount: number;
  issueCount: number;
}

interface WeeklyTrend {
  weekStart: number;
  taskCount: number;
  sessionCount: number;
  completedCount: number;
  errorCount: number;
}

interface AiInsights {
  summary: string;
  topIssueCategories: {
    category: string;
    description: string;
    count: number;
    severity: "low" | "medium" | "high";
    examples: string[];
  }[];
  commonErrorPatterns: {
    pattern: string;
    description: string;
    frequency: number;
    suggestedFix?: string;
  }[];
  temporalTrends: {
    trend: string;
    description: string;
  }[];
  recommendations: string[];
}

interface Report {
  analysisResults: {
    issueCategories: IssueCategory[];
    frequencyMap: FrequencyEntry[];
    temporalGroups: TemporalGroup[];
    workPatterns: WorkPatterns;
    issuesByDate?: IssuesByDateEntry[];
    dailyBreakdown?: DailyBreakdown[];
    weeklyTrend?: WeeklyTrend[];
  };
  aiInsights?: AiInsights;
  workItemCounts: {
    totalTasks: number;
    activeTasks: number;
    deletedTasks: number;
    totalSessions: number;
    activeSessions: number;
    deletedSessions: number;
  };
  dateRange?: {
    start: number;
    end: number;
  };
  tagIds?: string[];
}

interface ReportDisplayProps {
  report: Report;
}

const CATEGORY_COLORS: Record<string, string> = {
  bug: "rgba(239, 68, 68, 0.8)",
  feature: "rgba(59, 130, 246, 0.8)",
  refactor: "rgba(168, 85, 247, 0.8)",
  docs: "rgba(34, 197, 94, 0.8)",
  test: "rgba(234, 179, 8, 0.8)",
  performance: "rgba(249, 115, 22, 0.8)",
  security: "rgba(239, 68, 68, 0.8)",
  ui: "rgba(14, 165, 233, 0.8)",
  infrastructure: "rgba(115, 115, 115, 0.8)",
  uncategorized: "rgba(163, 163, 163, 0.8)",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
  medium: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  low: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
};

export function ReportDisplay({ report }: ReportDisplayProps) {
  const { analysisResults, aiInsights, workItemCounts } = report;
  const [temporalView, setTemporalView] = useState<"activity" | "daily" | "weekly">("activity");

  const issueCategoryChartData = useMemo(() => {
    const categories = analysisResults.issueCategories;
    return {
      labels: categories.map((c) => c.category.charAt(0).toUpperCase() + c.category.slice(1)),
      datasets: [
        {
          data: categories.map((c) => c.count),
          backgroundColor: categories.map(
            (c) => CATEGORY_COLORS[c.category] || CATEGORY_COLORS.uncategorized
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [analysisResults.issueCategories]);

  const frequencyChartData = useMemo(() => {
    const top15 = analysisResults.frequencyMap.slice(0, 15);
    return {
      labels: top15.map((f) => f.term),
      datasets: [
        {
          label: "Frequency",
          data: top15.map((f) => f.count),
          backgroundColor: "rgba(20, 184, 166, 0.6)",
          borderColor: "rgb(20, 184, 166)",
          borderWidth: 1,
        },
      ],
    };
  }, [analysisResults.frequencyMap]);

  const temporalChartData = useMemo(() => {
    const groups = analysisResults.temporalGroups;
    return {
      labels: groups.map((g) => dayjs(g.startDate).format("MMM D")),
      datasets: [
        {
          label: "Tasks",
          data: groups.map((g) => g.taskCount),
          backgroundColor: "rgba(20, 184, 166, 0.6)",
          borderColor: "rgb(20, 184, 166)",
          borderWidth: 1,
        },
        {
          label: "Sessions",
          data: groups.map((g) => g.sessionCount),
          backgroundColor: "rgba(168, 85, 247, 0.6)",
          borderColor: "rgb(168, 85, 247)",
          borderWidth: 1,
        },
      ],
    };
  }, [analysisResults.temporalGroups]);

  const dailyBreakdownChartData = useMemo(() => {
    const breakdown = analysisResults.dailyBreakdown;
    if (!breakdown || breakdown.length === 0) return null;
    return {
      labels: breakdown.map((d) => dayjs(d.date).format("MMM D")),
      datasets: [
        {
          label: "Tasks",
          data: breakdown.map((d) => d.taskCount),
          borderColor: "rgb(20, 184, 166)",
          backgroundColor: "rgba(20, 184, 166, 0.1)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Sessions",
          data: breakdown.map((d) => d.sessionCount),
          borderColor: "rgb(168, 85, 247)",
          backgroundColor: "rgba(168, 85, 247, 0.1)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Issues",
          data: breakdown.map((d) => d.issueCount),
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [analysisResults.dailyBreakdown]);

  const weeklyTrendChartData = useMemo(() => {
    const trend = analysisResults.weeklyTrend;
    if (!trend || trend.length === 0) return null;
    return {
      labels: trend.map((w) => dayjs(w.weekStart).format("MMM D")),
      datasets: [
        {
          label: "Tasks Created",
          data: trend.map((w) => w.taskCount),
          backgroundColor: "rgba(20, 184, 166, 0.6)",
          borderColor: "rgb(20, 184, 166)",
          borderWidth: 1,
        },
        {
          label: "Completed",
          data: trend.map((w) => w.completedCount),
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 1,
        },
        {
          label: "Errors",
          data: trend.map((w) => w.errorCount),
          backgroundColor: "rgba(239, 68, 68, 0.6)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 1,
        },
      ],
    };
  }, [analysisResults.weeklyTrend]);

  const issuesByDateChartData = useMemo(() => {
    const entries = analysisResults.issuesByDate;
    if (!entries || entries.length === 0) return null;
    const allCategories = new Set<string>();
    for (const entry of entries) {
      for (const issue of entry.issues) {
        allCategories.add(issue.category);
      }
    }
    const categoryList = [...allCategories];
    const formatStr = entries[0]?.granularity === "day" ? "MMM D" : entries[0]?.granularity === "month" ? "MMM YYYY" : "MMM D";
    return {
      labels: entries.map((e) => dayjs(e.date).format(formatStr)),
      datasets: categoryList.map((cat) => ({
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        data: entries.map((e) => {
          const found = e.issues.find((i) => i.category === cat);
          return found ? found.count : 0;
        }),
        borderColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS.uncategorized,
        backgroundColor: (CATEGORY_COLORS[cat] || CATEGORY_COLORS.uncategorized).replace("0.8", "0.1"),
        fill: false,
        tension: 0.3,
      })),
    };
  }, [analysisResults.issuesByDate]);

  const statusChartData = useMemo(() => {
    const dist = analysisResults.workPatterns.statusDistribution;
    return {
      labels: ["Todo", "In Progress", "Biz Review", "Code Review", "Done"],
      datasets: [
        {
          data: [dist.todo, dist.in_progress, dist.business_review, dist.code_review, dist.done],
          backgroundColor: [
            "rgba(115, 115, 115, 0.8)",
            "rgba(234, 179, 8, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(168, 85, 247, 0.8)",
            "rgba(34, 197, 94, 0.8)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [analysisResults.workPatterns.statusDistribution]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" as const },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { usePointStyle: true, padding: 12 } },
    },
  };

  const hasTemporalData =
    analysisResults.temporalGroups.length > 0 ||
    (analysisResults.dailyBreakdown && analysisResults.dailyBreakdown.length > 0) ||
    (analysisResults.weeklyTrend && analysisResults.weeklyTrend.length > 0);

  return (
    <div className="space-y-6">
      {/* Date range and multi-tag indicator */}
      {(report.dateRange || report.tagIds) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          {report.tagIds && report.tagIds.length > 1 && (
            <span className="flex items-center gap-1">
              Tags:
              {report.tagIds.map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="flat"
                  classNames={{
                    base: "bg-teal-100 dark:bg-teal-900/30",
                    content: "text-teal-700 dark:text-teal-300 text-xs",
                  }}
                >
                  {tag}
                </Chip>
              ))}
            </span>
          )}
          {report.dateRange && (
            <span className="flex items-center gap-1">
              <IconCalendarStats aria-hidden="true" className="w-3.5 h-3.5" />
              {dayjs(report.dateRange.start).format("MMM D, YYYY")} - {dayjs(report.dateRange.end).format("MMM D, YYYY")}
            </span>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IconChecklist}
          label="Total Tasks"
          value={workItemCounts.totalTasks}
          color="pink"
        />
        <StatCard
          icon={IconTerminal2}
          label="Total Sessions"
          value={workItemCounts.totalSessions}
          color="yellow"
        />
        <StatCard
          icon={IconPercentage}
          label="Run Success Rate"
          value={`${analysisResults.workPatterns.runSuccessRate}%`}
          color="green"
        />
        <StatCard
          icon={IconTrash}
          label="Deleted Items"
          value={workItemCounts.deletedTasks + workItemCounts.deletedSessions}
          color="neutral"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Issue Categories */}
        {analysisResults.issueCategories.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
              Issue Categories
            </h3>
            <div className="h-64" role="img" aria-label={`Issue categories chart: ${analysisResults.issueCategories.map((c) => `${c.category} ${c.count}`).join(", ")}`}>
              <Doughnut data={issueCategoryChartData} options={doughnutOptions} />
            </div>
          </div>
        )}

        {/* Status Distribution */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
            Task Status Distribution
          </h3>
          <div className="h-64" role="img" aria-label={`Task status distribution: Todo ${analysisResults.workPatterns.statusDistribution.todo}, In Progress ${analysisResults.workPatterns.statusDistribution.in_progress}, Business Review ${analysisResults.workPatterns.statusDistribution.business_review}, Code Review ${analysisResults.workPatterns.statusDistribution.code_review}, Done ${analysisResults.workPatterns.statusDistribution.done}`}>
            <Doughnut data={statusChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Frequency Chart */}
      {analysisResults.frequencyMap.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
            Top Terms by Frequency
          </h3>
          <div className="h-64" role="img" aria-label={`Top terms by frequency: ${analysisResults.frequencyMap.slice(0, 15).map((f) => `${f.term} ${f.count}`).join(", ")}`}>
            <Bar data={frequencyChartData} options={barOptions} />
          </div>
        </div>
      )}

      {/* Temporal Section with view toggle */}
      {hasTemporalData && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <IconChartLine aria-hidden="true" className="w-4 h-4" />
              Work Distribution Over Time
            </h3>
            <div role="group" aria-label="Chart view" className="flex gap-1">
              <button
                onClick={() => setTemporalView("activity")}
                aria-pressed={temporalView === "activity"}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  temporalView === "activity"
                    ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                    : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                Activity
              </button>
              {dailyBreakdownChartData && (
                <button
                  onClick={() => setTemporalView("daily")}
                  aria-pressed={temporalView === "daily"}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    temporalView === "daily"
                      ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  Daily
                </button>
              )}
              {weeklyTrendChartData && (
                <button
                  onClick={() => setTemporalView("weekly")}
                  aria-pressed={temporalView === "weekly"}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    temporalView === "weekly"
                      ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  Weekly
                </button>
              )}
            </div>
          </div>
          <div className="h-64" role="img" aria-label="Work distribution over time chart">
            {temporalView === "activity" && analysisResults.temporalGroups.length > 0 && (
              <Bar
                data={temporalChartData}
                options={{
                  ...barOptions,
                  plugins: {
                    legend: { display: true, position: "top" as const },
                  },
                }}
              />
            )}
            {temporalView === "daily" && dailyBreakdownChartData && (
              <Line data={dailyBreakdownChartData} options={lineOptions} />
            )}
            {temporalView === "weekly" && weeklyTrendChartData && (
              <Bar
                data={weeklyTrendChartData}
                options={{
                  ...barOptions,
                  plugins: {
                    legend: { display: true, position: "top" as const },
                  },
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Issues Over Time (by category) */}
      {issuesByDateChartData && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <IconCalendarStats aria-hidden="true" className="w-4 h-4" />
            Issues Over Time by Category
          </h3>
          <div className="h-72" role="img" aria-label="Issues over time by category chart">
            <Line data={issuesByDateChartData} options={lineOptions} />
          </div>
        </div>
      )}

      {/* Work Patterns */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <IconClock aria-hidden="true" className="w-4 h-4" />
          Work Patterns
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {analysisResults.workPatterns.avgTaskDuration
                ? `${Math.round(analysisResults.workPatterns.avgTaskDuration / (1000 * 60 * 60))}h`
                : "N/A"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Avg Task Duration</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {analysisResults.workPatterns.avgSessionMessages}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Avg Session Messages</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {analysisResults.workPatterns.runSuccessRate}%
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Run Success Rate</p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <IconBulb aria-hidden="true" className="w-4 h-4 text-yellow-500" />
              AI Summary
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {aiInsights.summary}
            </p>
          </div>

          {/* Top Issue Categories from AI */}
          {aiInsights.topIssueCategories.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <IconTag aria-hidden="true" className="w-4 h-4 text-teal-500" />
                Key Issue Areas
              </h3>
              <div className="space-y-3">
                {aiInsights.topIssueCategories.map((cat, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {cat.category}
                      </span>
                      <Chip
                        size="sm"
                        variant="flat"
                        className={SEVERITY_COLORS[cat.severity]}
                      >
                        {cat.severity}
                      </Chip>
                      <span className="text-xs text-neutral-500">({cat.count} items)</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {cat.description}
                    </p>
                    {cat.examples.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {cat.examples.map((ex, j) => (
                          <Chip
                            key={j}
                            size="sm"
                            variant="flat"
                            className="bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                          >
                            {ex}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Patterns */}
          {aiInsights.commonErrorPatterns.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <IconAlertTriangle aria-hidden="true" className="w-4 h-4 text-red-500" />
                Common Error Patterns
              </h3>
              <div className="space-y-3">
                {aiInsights.commonErrorPatterns.map((pat, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {pat.pattern}
                      </span>
                      <span className="text-xs text-neutral-500">
                        ({pat.frequency} occurrences)
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {pat.description}
                    </p>
                    {pat.suggestedFix && (
                      <p className="text-sm text-teal-600 dark:text-teal-400">
                        Fix: {pat.suggestedFix}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Temporal Trends */}
          {aiInsights.temporalTrends.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <IconTrendingUp aria-hidden="true" className="w-4 h-4 text-teal-500" />
                Temporal Trends
              </h3>
              <div className="space-y-2">
                {aiInsights.temporalTrends.map((t, i) => (
                  <div key={i} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {t.trend}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {aiInsights.recommendations.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <IconBulb aria-hidden="true" className="w-4 h-4 text-yellow-500" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {aiInsights.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <span aria-hidden="true" className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
