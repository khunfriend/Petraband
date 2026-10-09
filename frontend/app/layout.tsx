import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { RouteFade } from "@/components/RouteFade";
import { Ripple } from "@/components/Ripple";
import { ClickBurst } from "@/components/ClickBurst";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { auth } from "@/auth";
import "./globals.css";

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
    <html lang="th" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-canvas text-ink antialiased">
        <SessionProvider session={session}>
          <ToastProvider>
            <ConfirmProvider>
              <Ripple />
              <ClickBurst />
              <TopNav />
              <RouteFade>{children}</RouteFade>
            </ConfirmProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
