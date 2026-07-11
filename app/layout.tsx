import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LottoMind AI PRO",
  description: "AI 추천번호와 수동번호를 관리하는 모바일 로또 분석 앱",
  manifest: "/LottoMind-Mobile/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LottoMind" },
  icons: { icon: "/LottoMind-Mobile/icon-192.png", apple: "/LottoMind-Mobile/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#091528",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
