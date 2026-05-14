import React, { type ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Your global CSS, including Tailwind directives

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Neighborhood Library",
  description: "Manage your library books and members",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
