import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talia Sourcing Intelligence | TA Connections",
  description: "Read-only hotel sourcing intelligence across SharePoint, Cvent, and StormX.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
