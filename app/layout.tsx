import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Airwave — Free Online Radio",
  description: "Tune in to radio stations from around the world, for free.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
