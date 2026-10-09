import type { Metadata } from "next";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { LangProvider } from "@/i18n";

const SITE_URL = "https://toronto-parking-tickets-geocoded.vercel.app";

export const metadata: Metadata = {
  title: "Toronto Parking Tickets, Geocoded: what 50 million tickets look like on a map",
  description:
    "Three years of Toronto parking tickets (2023-2025) geocoded to wards and neighbourhoods. Explorer, REST API, OpenAPI docs, and MCP tools. Open data, MIT licensed.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Toronto Parking Tickets, Geocoded: what 50 million tickets look like on a map",
    description:
      "Three years of Toronto parking tickets (2023-2025) geocoded to wards and neighbourhoods. Explorer, REST API, OpenAPI docs, and MCP tools. Open data, MIT licensed.",
    url: SITE_URL,
    siteName: "Nshipyard Canada",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toronto Parking Tickets, Geocoded: what 50 million tickets look like on a map",
    description:
      "Three years of Toronto parking tickets (2023-2025) geocoded to wards and neighbourhoods. Explorer, REST API, OpenAPI docs, and MCP tools. Open data, MIT licensed.",
    images: [`${SITE_URL}/og-image.png`],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
