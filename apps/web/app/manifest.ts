import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eva - Your New Coworker",
    short_name: "Eva",
    description:
      "Meet Eva, your new AI coworker. Manage tasks, ship code, and track progress in real-time.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d9488",
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
