import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maestro AI — Make music, one step at a time",
  description: "An expressive music-learning studio with guided lessons, interactive piano practice, rhythm training and age-adapted experiences.",
  applicationName: "Maestro AI",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Maestro AI" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#211f3e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
