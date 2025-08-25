"use client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { UserProfileDropdown } from "@/components/ui/user-profile-dropdown";

interface AppShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  title: string;
}

export function AppShell({ children, sidebar, title }: AppShellProps) {

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
                    {sidebar}
                  </SheetContent>
                </Sheet>
              </div>
              <div className="font-medium">{title}</div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <UserProfileDropdown />
            </div>
          </div>
        </header>
        <div className="flex">
          <aside className="hidden w-64 border-r bg-background md:block">
            {sidebar}
          </aside>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}


