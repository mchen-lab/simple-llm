
import { useState } from "react";
import axios from "axios";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ChatModal({ open, onOpenChange, onSuccess }: ChatModalProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("openrouter:google/gemini-2.0-flash-lite-001");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);

    try {
      await axios.post("/api/generate", {
        model,
        prompt,
        tag: tag || undefined,
        response_format: "text",
      });
      
      setPrompt("");
      setTag("");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chat Test</DialogTitle>
          <DialogDescription>
            Quickly test prompts and generate logs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="modal-model">Model</Label>
            <Input 
              id="modal-model" 
              value={model} 
              onChange={(e) => setModel(e.target.value)} 
              placeholder="provider:model" 
              className="h-8 text-sm"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="modal-tag">Tag (Optional)</Label>
            <Input 
              id="modal-tag" 
              value={tag} 
              onChange={(e) => setTag(e.target.value)} 
              placeholder="e.g. test-run" 
              className="h-8 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="modal-prompt">Prompt</Label>
            <Textarea
              id="modal-prompt"
              placeholder="What's on your mind?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[150px] text-sm"
            />
          </div>
          
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading || !prompt} className="min-w-[100px]">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
