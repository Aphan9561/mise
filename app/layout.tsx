import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${fraunces.variable} h-full scroll-smooth antialiased`}
    >
      <ClerkProvider>
        <body className="min-h-full flex flex-col bg-mise-page text-mise-ink font-sans">
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
