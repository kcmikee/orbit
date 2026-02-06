export const siteConfig = {
  name: "Orbit",
  url:
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://ai.eliza.how/" ||
    "http://localhost:4000",
  description:
    "Agentic RWA Treasury Manager. An autonomous AI agent that manages Real-World Asset treasuries on Arc L1—Circle custody, Stork oracles, Uniswap v4 yield.",
  ogImage: "/og.png",
  creator: "Orbit",
  icons: [
    {
      rel: "icon",
      type: "image/png",
      url: "/eliza-black.png",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      type: "image/png",
      url: "/favicon.ico",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};
