import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { ProfileProvider } from "@/context/profile-context";
import { HydrateClient } from "@/trpc/server";
import { Navbar } from "@/app/_components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { getServerAuthSession } from "@/server/auth";

export const metadata: Metadata = {
  title: "Mini CRM",
  description: "Mini CRM",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <TRPCReactProvider>
          <HydrateClient>
            <ProfileProvider>
              <div className="min-h-screen">
                <Navbar session={session} />
                <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
            </ProfileProvider>
          </HydrateClient>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
