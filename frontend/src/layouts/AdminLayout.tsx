
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { MessageSquare, Settings, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatModal from "@/components/ChatModal";
import SettingsModal from "@/components/SettingsModal";

export default function AdminLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <span className="font-bold">
              Simple LLM
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-primary"
                onClick={() => setChatOpen(true)}
                title="Chat Test"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-primary"
                onClick={() => setSettingsOpen(true)}
                title="Configuration"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
          <Outlet context={{ refreshLogs: () => { /* This will be handled via events or direct prop if needed */ } }} />
      </main>

      {/* Modals */}
      <ChatModal 
        open={chatOpen} 
        onOpenChange={setChatOpen} 
        onSuccess={() => {
            // Trigger refresh in LogsPage via window event for simplicity across routes
            window.dispatchEvent(new CustomEvent("refresh-logs"));
        }} 
      />
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </div>
  );
}
