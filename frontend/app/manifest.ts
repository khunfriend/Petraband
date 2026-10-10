import type { MetadataRoute } from "next";

// Lets phones "Add to Home Screen" and open the site full-screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PETRAband",
    short_name: "PETRAband",
    description: "ระบบจัดการวงดนตรีไทย PETRAband",
    lang: "th",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f1e8",
    theme_color: "#142748",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
