import Link from "next/link";
import {
  IconRobot,
  IconBrain,
  IconGitBranch,
  IconClockHour4,
  IconChartBar,
} from "@tabler/icons-react";
import { LandingAuthNav } from "./LandingAuthNav";
import { LandingAuthCTA } from "./LandingAuthCTA";

const features = [
  {
    icon: IconRobot,
    title: "Agent Task Assignment",
    description:
      "Assign tasks to LLM agents and monitor their execution in real-time.",
  },
  {
    icon: IconGitBranch,
    title: "Task Dependencies",
    description:
      "Define task relationships and let the system handle execution order.",
  },
  {
    icon: IconClockHour4,
    title: "Real-time Sync",
    description:
      "Powered by Convex for instant updates across all connected clients.",
  },
  {
    icon: IconChartBar,
    title: "Execution History",
    description:
      "Track every agent action with detailed logs and performance metrics.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <IconBrain className="w-8 h-8 text-pink-600" />
              <span className="text-xl font-semibold text-neutral-900 dark:text-white">
                Conductor
              </span>
            </div>
            <LandingAuthNav />
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium text-pink-600 bg-pink-50 dark:bg-pink-900/20 rounded-full">
              <IconRobot className="w-4 h-4" />
              LLM Agent Orchestration
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
              Orchestrate Your
              <span className="text-pink-600"> AI Agents</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
              A powerful Kanban-style platform to manage, assign, and track LLM
              agent tasks with real-time sync, dependency management, and
              execution history.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <LandingAuthCTA variant="hero" />
              <a
                href="#features"
                className="w-full sm:w-auto px-6 py-3 text-base font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-800/50"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Built for teams managing AI workflows at scale
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-pink-200 dark:hover:border-pink-800 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
              Ready to Orchestrate?
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
              Start managing your AI agents today with our intuitive Kanban
              board.
            </p>
            <LandingAuthCTA variant="bottom" />
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto text-center text-sm text-neutral-500 dark:text-neutral-400">
          <p>© {new Date().getFullYear()} Conductor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
