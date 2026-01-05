import { useEffect, useState } from "react";
import axios from "axios";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/settings");
      setSettings(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post("/api/settings", settings);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateApiKey = (provider: string, value: string) => {
    setSettings({
      ...settings,
      api_keys: { ...settings.api_keys, [provider]: value }
    });
  };

  const updateBaseUrl = (provider: string, value: string) => {
    setSettings({
      ...settings,
      base_urls: { ...settings.base_urls, [provider]: value }
    });
  };

  const updateModelNames = (value: string) => {
    setSettings({
      ...settings,
      model_names: value
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Configuration</DialogTitle>
          <DialogDescription>
            Manage API keys, provider endpoints, and allowed models.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading || !settings ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Tabs defaultValue="parameters" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b">
                <TabsList className="w-full justify-start h-10 bg-transparent p-0 gap-6">
                  <TabsTrigger value="parameters" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 focus-visible:outline-none focus-visible:ring-0">Parameters</TabsTrigger>
                  <TabsTrigger value="models" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10 focus-visible:outline-none focus-visible:ring-0">Model Names</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">
                <TabsContent value="parameters" className="m-0 space-y-6 focus-visible:outline-none">
                  {/* Open Router Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">Open Router</h3>
                    <div className="grid gap-1.5">
                      <Label htmlFor="openrouter-api-key" className="text-xs">OPEN_ROUTER_API_KEY</Label>
                      <Input
                        id="openrouter-api-key"
                        type="password"
                        value={settings.api_keys?.openrouter || ""}
                        onChange={(e) => updateApiKey("openrouter", e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Ollama Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-1">Ollama</h3>
                    <div className="grid gap-1.5">
                      <Label htmlFor="ollama-base-url" className="text-xs">OLLAMA_BASE_URL</Label>
                      <Input
                        id="ollama-base-url"
                        value={settings.base_urls?.ollama || ""}
                        onChange={(e) => updateBaseUrl("ollama", e.target.value)}
                        placeholder="http://localhost:11434/v1"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="models" className="m-0 h-full flex flex-col focus-visible:outline-none">
                  <div className="space-y-2 flex-1 flex flex-col">
                    <Label htmlFor="model-names" className="text-xs text-muted-foreground">
                      Paste the list of allowed models (one per line or comma-separated).
                    </Label>
                    <Textarea
                      id="model-names"
                      className="flex-1 font-mono text-sm resize-none"
                      placeholder="openrouter:google/gemini-2.0-flash-exp&#10;ollama:llama3"
                      value={settings.model_names || ""}
                      onChange={(e) => updateModelNames(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </div>
              
              {error && <div className="px-6 pb-2 text-xs text-destructive">{error}</div>}
            </Tabs>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !settings}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
