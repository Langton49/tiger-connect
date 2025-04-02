
import { MobileNav } from "./mobile-nav";
import { AppHeader } from "./app-header";
import { ReactNode } from "react";

export function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex flex-col min-h-screen bg-grambling-gray">
      <AppHeader title={title} />
      <main className="flex-1 container mx-auto p-4 pb-20">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
