import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_APP_NAME || "MetaFrame Academy";
  return {
    name,
    short_name: name,
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
