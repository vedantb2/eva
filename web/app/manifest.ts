import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vello - Learn Marathi",
    short_name: "Vello",
    description:
      "Learn Marathi language and explore Maharashtra's culture. Master vocabulary, discover festivals, and use the Marathi calendar.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#eab308",
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
    categories: ["education", "language", "culture"],
    lang: "en",
    dir: "ltr",
  };
}
