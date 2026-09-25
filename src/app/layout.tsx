import type { Metadata } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "./globals.css";

import { PageTransitionLoader } from "@/components/page-transition-loader";

export const metadata: Metadata = {
  title: "Draftwise - IELTS writing that remembers",
  description:
    "A personal IELTS writing coach that turns your own mistakes into lasting progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <PageTransitionLoader />
        {children}
      </body>
    </html>
  );
}
