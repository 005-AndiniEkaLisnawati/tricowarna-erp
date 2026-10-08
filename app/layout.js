import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Applies the saved theme and sidebar mode before first paint so neither flashes.
const themeScript = `try{var d=document.documentElement,t=localStorage.getItem("erp-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");d.dataset.sidebar=localStorage.getItem("erp-sidebar")||"full"}catch(e){}`;

export const metadata = {
  title: {
    template: "%s · Trico Wana ERP",
    default: "Trico Wana ERP",
  },
  description:
    "Demo ERP konstruksi multi-company: estimasi tender, procure-to-pay, kas lapangan, budgeting, akuntansi & pajak.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
