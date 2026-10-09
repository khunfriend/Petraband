import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import { RouteFade } from "@/components/RouteFade";
import { SelectBounce } from "@/components/SelectBounce";
import { HoverLift } from "@/components/HoverLift";
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
              <SelectBounce />
              <HoverLift />
              <TopNav />
              <RouteFade>{children}</RouteFade>
            </ConfirmProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
