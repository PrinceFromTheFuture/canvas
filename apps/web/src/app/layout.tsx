import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { TrpcProvider } from "@/lib/TrpcProvider";

export const metadata: Metadata = {
  title: "Report Builder",
  description: "Upload data, let AI author a shareable report in a constrained, print-ready language.",
};
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
