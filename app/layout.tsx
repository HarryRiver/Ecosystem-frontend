import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/index.css";

export const metadata: Metadata = {
  title: {
    default: "EcoCollect - Nền tảng thu gom đồ cũ & rác thải thông minh",
    template: "%s | EcoCollect",
  },
  description: "Dịch vụ thu gom đồ cũ, rác thải cồng kềnh, phế thải xây dựng nhanh chóng, minh bạch và thân thiện với môi trường tại Việt Nam.",
  keywords: ["thu gom đồ cũ", "rác thải cồng kềnh", "phế thải xây dựng", "eco-tech", "tái chế", "dọn dẹp nhà cửa", "EcoCollect"],
  authors: [{ name: "EcoCollect Team" }],
  creator: "EcoCollect",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://ecocollect.vn",
    title: "EcoCollect - Nền tảng thu gom đồ cũ thông minh",
    description: "Nhận báo giá minh bạch và đặt lịch thu gom đồ cũ chỉ trong 60 giây. Xử lý xanh cho đô thị hiện đại.",
    siteName: "EcoCollect",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoCollect - Thu gom đồ cũ thông minh",
    description: "Giải pháp công nghệ cho việc thu gom và xử lý phế liệu thân thiện với môi trường.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
