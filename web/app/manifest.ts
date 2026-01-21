import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulse - Kanban for AI Agents",
    short_name: "Pulse",
    description:
      "Orchestrate AI agents with a Kanban-style interface. Manage tasks, trigger agent runs, and track execution in real-time.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#db2777",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["productivity", "developer tools"],
    lang: "en",
    dir: "ltr",
  };
}
