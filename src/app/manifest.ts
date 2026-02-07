import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeuwooMoney",
    short_name: "MeuwooMoney",
    description: "Shared expense tracker for Felix & Sophie",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F0",
    theme_color: "#F4A261",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
