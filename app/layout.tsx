import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mise | Cook With What You Have",
  description:
    "A cooking app starter built with Next.js and Tailwind, designed for recipes, meal plans, and smart pantry cooking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <ClerkProvider>
        <body className="min-h-full flex flex-col">{children}</body>
      </ClerkProvider>
    </html>
  );
}
