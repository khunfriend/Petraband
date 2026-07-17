import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { SessionProvider } from "@/components/SessionProvider";
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
          <TopNav />
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
