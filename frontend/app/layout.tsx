import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { RouteFade } from "@/components/RouteFade";
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
    <html lang="th" className="h-full">
      <body className="min-h-full flex flex-col bg-canvas text-ink antialiased">
        <SessionProvider session={session}>
          <ToastProvider>
            <ConfirmProvider>
              <TopNav />
              <RouteFade>{children}</RouteFade>
            </ConfirmProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
