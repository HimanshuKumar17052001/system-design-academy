"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { AuthModal } from "./AuthModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, BarChart3, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}>
          Sign In
        </Button>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  const displayName =
    (user.user_metadata?.full_name as string) || user.email || "User";
  const initials = getInitials(displayName);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-accent focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Open user menu"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </Button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-lg border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95 duration-100 z-50">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate mt-1">
              {user.email}
            </p>
          </div>
          <div className="py-1">
            <Link
              href="/progress"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md cursor-pointer"
              onClick={() => setDropdownOpen(false)}
            >
              <BarChart3 className="size-4" />
              My Progress
            </Link>
            <Link
              href="/dashboard"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md cursor-pointer"
              onClick={() => setDropdownOpen(false)}
            >
              <User className="size-4" />
              Dashboard
            </Link>
          </div>
          <div className="border-t pt-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent rounded-md cursor-pointer"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}