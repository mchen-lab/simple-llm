
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, MessageSquare, Settings, FileText, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function AdminLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Chat Test", icon: MessageSquare },
    { href: "/logs", label: "Logs", icon: FileText },
    { href: "/settings", label: "Configuration", icon: Settings },
  ];

  const NavContent = () => (
    <div className="flex flex-col gap-2 py-4">
      <div className="flex items-center gap-2 px-4 mb-4 text-xl font-bold text-primary">
        <Bot className="w-8 h-8" />
        <span>Simple LLM</span>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              location.pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 border-r flex-col fixed inset-y-0">
        <NavContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="font-semibold">Simple LLM Admin</div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
