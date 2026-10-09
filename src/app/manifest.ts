import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_APP_NAME || "Академия";
  return {
    name,
    short_name: name,
    start_url: "/",
    display: "standalone",
    background_color: "#f3f4f7",
    theme_color: "#f3f4f7",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
