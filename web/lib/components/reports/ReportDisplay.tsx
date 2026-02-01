"use client";

import { useMemo } from "react";
import { Chip } from "@heroui/react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
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
} from "@tabler/icons-react";
import { StatCard } from "@/lib/components/analytics/StatCard";
import dayjs from "@/lib/dates";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { usePointStyle: true, padding: 12 } },
    },
  };

  return (
    <div className="space-y-6">
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
            <div className="h-64">
              <Doughnut data={issueCategoryChartData} options={doughnutOptions} />
            </div>
          </div>
        )}

        {/* Status Distribution */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
            Task Status Distribution
          </h3>
          <div className="h-64">
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
          <div className="h-64">
            <Bar data={frequencyChartData} options={barOptions} />
          </div>
        </div>
      )}

      {/* Temporal Trends */}
      {analysisResults.temporalGroups.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
            Activity Over Time
          </h3>
          <div className="h-64">
            <Bar
              data={temporalChartData}
              options={{
                ...barOptions,
                plugins: {
                  legend: { display: true, position: "top" as const },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Work Patterns */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <IconClock className="w-4 h-4" />
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
              <IconBulb className="w-4 h-4 text-yellow-500" />
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
                <IconTag className="w-4 h-4 text-teal-500" />
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
                <IconAlertTriangle className="w-4 h-4 text-red-500" />
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
                <IconTrendingUp className="w-4 h-4 text-teal-500" />
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
                <IconBulb className="w-4 h-4 text-yellow-500" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {aiInsights.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
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
