// `Metadata` describes the browser and search-engine information for this app.
import type { Metadata } from "next";
// Importing this file once here makes its global styles available on every page.
import "./globals.css";

// Next.js reads this object and turns it into elements such as `<title>`.
export const metadata: Metadata = {
  // This text appears in the browser tab.
  title: "The Secret Garden",
  // This text can be used by search engines and link previews.
  description: "Every encounter leaves a seed.",
};

// Every route is rendered inside this root layout.
export default function RootLayout({
  // `children` is the page that Next.js wants the layout to display.
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A Next.js root layout must return the document's `<html>` and `<body>` tags.
  return (
    // Declaring the language helps browsers and assistive technology.
    <html lang="en">
      {/* Render the active page inside the document body. */}
      <body>{children}</body>
    </html>
  );
}
