import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Mr. Biryani — Biryani Made With Passion",
    template: "%s · Mr. Biryani",
  },
  description:
    "Slow-cooked, fragrant, authentic biryani crafted with generations of flavour. Order online, book a table, or find us across Kathmandu, Lalitpur and Pokhara.",
  openGraph: {
    title: "Mr. Biryani — Biryani Made With Passion",
    description:
      "Slow-cooked. Fragrant. Authentic. Crafted with generations of flavour.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          richColors
          toastOptions={{ duration: 3600 }}
        />
      </body>
    </html>
  );
}
