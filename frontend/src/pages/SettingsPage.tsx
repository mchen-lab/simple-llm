
import { useEffect, useState } from "react";
import axios from "axios";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { useToast } from "@/hooks/use-toast"; // We use local state instead

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/settings");
      setSettings(res.data);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    try {
      await axios.post("/api/settings", settings);
      setMsg({ type: 'success', text: "Settings saved successfully" });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: "Failed to save settings" });
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

  if (loading || !settings) {
     return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configuration</h2>
        <p className="text-muted-foreground">
          Manage API keys and provider endpoints.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-md ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage credentials for LLM providers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.api_keys || {}).map(([provider, key]) => (
            <div key={provider} className="grid w-full items-center gap-1.5">
              <Label htmlFor={`key-${provider}`}>{provider}</Label>
              <Input
                id={`key-${provider}`}
                type="password"
                value={key as string}
                onChange={(e) => updateApiKey(provider, e.target.value)}
              />
            </div>
          ))}
          {/* Add mechanism to add new keys if needed, but for now stick to predefined or loaded */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base URLs</CardTitle>
          <CardDescription>Endpoint URLs for providers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {Object.entries(settings.base_urls || {}).map(([provider, url]) => (
            <div key={provider} className="grid w-full items-center gap-1.5">
              <Label htmlFor={`url-${provider}`}>{provider}</Label>
              <Input
                id={`url-${provider}`}
                value={url as string}
                onChange={(e) => updateBaseUrl(provider, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
