import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev Rehab Lab",
  description:
    "오랜 공백 뒤 다시 개발 감각을 되살리는 사람을 위한 코딩 재활 훈련장",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
