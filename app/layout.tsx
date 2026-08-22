import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Secret Garden",
  description: "Every encounter leaves a seed.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
