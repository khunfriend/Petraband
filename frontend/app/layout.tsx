import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import { RouteFade } from "@/components/RouteFade";
import { Ripple } from "@/components/Ripple";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { auth } from "@/auth";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "PETRAband", template: "%s | PETRAband" },
  description: "ระบบจัดการวงดนตรีไทย PETRAband",
  applicationName: "PETRAband",
  // iPhone "Add to Home Screen": full-screen, navy status bar over the nav.
  appleWebApp: { capable: true, title: "PETRAband", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#142748",
  // Lets the page reach under the notch; the nav pads itself with the safe area.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="th" className={`h-full ${plex.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-canvas text-ink antialiased">
        <SessionProvider session={session}>
          <ToastProvider>
            <ConfirmProvider>
              <Ripple />
              <TopNav />
              <RouteFade>{children}</RouteFade>
            </ConfirmProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
