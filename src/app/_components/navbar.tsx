"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileSelector } from "./profiles-selector";
import { GearIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { type Session } from "next-auth";

type NavbarProps = {
  session: Session | null;
};

export function Navbar({ session }: NavbarProps) {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Contacts", href: "/contacts" },
    { name: "Actions Log", href: "/actions" },
  ];

  return (
    <nav className="bg-background shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-foreground">
              Mini CRM
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
              {session && navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "border-b-2 border-primary font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {session && (
              <>
                <ProfileSelector />
                <Link href="/profiles">
                  <GearIcon className="ms-4 h-4 w-4" />
                </Link>
              </>
            )}
            {!session && (
              <div className="flex items-center space-x-2">
                {/* <Link href="/sign-up">
                  <Button variant="default" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </Link> */}
                <Link href="/api/auth/signin">
                  <Button variant="outline" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
