
import { useEffect, useState } from "react";
import axios from "axios";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Configuration</DialogTitle>
          <DialogDescription>
            Manage API keys and provider endpoints.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          {loading || !settings ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">API Keys</h3>
                {Object.entries(settings.api_keys || {}).map(([provider, key]) => (
                  <div key={provider} className="grid gap-1.5">
                    <Label htmlFor={`modal-key-${provider}`} className="text-xs">{provider}</Label>
                    <Input
                      id={`modal-key-${provider}`}
                      type="password"
                      value={key as string}
                      onChange={(e) => updateApiKey(provider, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Base URLs</h3>
                {Object.entries(settings.base_urls || {}).map(([provider, url]) => (
                  <div key={provider} className="grid gap-1.5">
                    <Label htmlFor={`modal-url-${provider}`} className="text-xs">{provider}</Label>
                    <Input
                      id={`modal-url-${provider}`}
                      value={url as string}
                      onChange={(e) => updateBaseUrl(provider, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
              
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !settings}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
