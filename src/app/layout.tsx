import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kapate OS — Enterprise Business Operating System",
  description:
    "Kapate OS is the unified internal operating platform for Kapate Consultancy — managing CRM, projects, workforce, and finances.",
  keywords: "Kapate Consultancy, ERP, CRM, Project Management, Business OS",
  authors: [{ name: "Kapate Consultancy" }],
  openGraph: {
    title: "Kapate OS",
    description: "Enterprise Business Operating System for Kapate Consultancy",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
