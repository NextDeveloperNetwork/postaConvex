import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { AppStateProvider } from "@/lib/store";
import { ToastProvider } from "@/components/toast-notification";

export const metadata: Metadata = {
  title: "POSTA Shqiptare Logistics | Courier & COD Financial System",
  description: "Sistemi i menaxhimit të dërgesave postare dhe likuidimeve financiare COD në Lekë Shqiptarë (ALL).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className="dark">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 selection:bg-red-500 selection:text-white">
        <I18nProvider>
          <AppStateProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AppStateProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
