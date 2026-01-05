
import { useState } from "react";
import axios from "axios";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("openrouter:google/gemini-2.5-flash-lite");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Use relative path; Vite proxy will handle forwarding to localhost:8000
      const res = await axios.post("/api/generate", {
        model,
        prompt,
        response_format: "text",
      });
      
      if (res.data.status === "success") {
        setResponse(res.data.data);
      } else {
        setError("Unknown error occurred");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Chat Test</h2>
        <p className="text-muted-foreground">
          Test your LLM connection and prompt engineering.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              {/* Simple Input for now, could be a Select if we fetched available models */}
              <Input 
                id="model" 
                value={model} 
                onChange={(e) => setModel(e.target.value)} 
                placeholder="provider:model_name" 
              />
              <p className="text-xs text-muted-foreground">
                Format: <code>provider:model</code> (e.g., <code>openrouter:google/gemini-2.5-flash-lite</code>)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                className="min-h-[200px]"
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <Button onClick={handleGenerate} disabled={loading || !prompt} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate Response
                </>
              )}
            </Button>
            
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>Response from the LLM</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[600px]">
                {response ? (
                    <div className="prose dark:prose-invert whitespace-pre-wrap text-sm">
                        {response}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                        Response will appear here...
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
