import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Instrument_Sans, Space_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

/* Clerk turns on the moment BOTH keys exist in .env — until then the
   site runs unchanged on its fallback auth. (One key alone is not a
   valid state: clerkMiddleware needs the secret too.) */
const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

const serif = Instrument_Serif({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const sans = Instrument_Sans({
  variable: "--font-body-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = Space_Mono({
  variable: "--font-code-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "The Mind Code — Crack the concept. Own the exam.",
  description:
    "Clear notes, sharp worksheets, real practice papers — everything you need to go from confused to confident. Free, forever. The Mind Code: a learning universe for Classes 6–10.",
  keywords: [
    "The Mind Code",
    "CBSE",
    "Class 10",
    "free notes",
    "worksheets",
    "practice papers",
    "study resources",
    "Pankaj Malik",
  ],
  authors: [{ name: "The Mind Code" }],
  openGraph: {
    title: "The Mind Code — Crack the concept. Own the exam.",
    description:
      "A learning universe. Clear notes, sharp worksheets, real practice papers — free, forever.",
    siteName: "The Mind Code",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#071A33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${serif.variable} ${sans.variable} ${mono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {CLERK_ENABLED ? (
            <ClerkProvider appearance={{ theme: shadcn }}>{children}</ClerkProvider>
          ) : (
            children
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
