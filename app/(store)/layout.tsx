"use client";

import { StoreSidebar } from "@/components/layout/StoreSidebar";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { UserProfileDropdown } from "@/components/ui/user-profile-dropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex-1">
        <header className="sticky top-0 z-20 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="pl-1 pr-0">
                    <StoreSidebar />
                  </SheetContent>
                </Sheet>
              </div>
              <div className="font-medium">Store Dashboard</div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <UserProfileDropdown />
            </div>
          </div>
        </header>
        <div className="flex">
          <aside className="hidden w-64 border-r bg-background md:block">
            <StoreSidebar />
          </aside>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
