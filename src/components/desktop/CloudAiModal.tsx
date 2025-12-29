import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sophistication?: 'low' | 'medium' | 'high' | 'very-high';
}

export const CloudAiModal: React.FC<Props> = ({ isOpen, onClose, sophistication = 'very-high' }) => {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<EventSource | null>(null);
  const [model, setModel] = useState<string>("gpt-4o");
  const [temperature, setTemperature] = useState<number>(0.2);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    const userQ = query.trim();
    // Use SSE streaming endpoint if available
    setResponses((rs) => [...rs, `You: ${userQ}`, `CloudAi: `]);
    setStreaming(true);
    try {
      const es = new EventSource(
        `/api/cloud-ai-stream?prompt=${encodeURIComponent(userQ)}` +
          `&sophistication=${encodeURIComponent(sophistication)}` +
          `&model=${encodeURIComponent(model)}` +
          `&temperature=${encodeURIComponent(String(temperature))}`
      );
      streamRef.current = es;
      let acc = "";
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.chunk) {
            acc += payload.chunk;
            // update last message
            setResponses((rs) => {
              const copy = [...rs];
              copy[copy.length - 1] = `CloudAi: ${acc}`;
              return copy;
            });
          }
        } catch (e) {
          // ignore
        }
      };
      es.addEventListener('done', () => {
        setStreaming(false);
        es.close();
        streamRef.current = null;
      });
      es.onerror = () => {
        setStreaming(false);
        es.close();
        streamRef.current = null;
        setResponses((rs) => {
          const copy = [...rs];
          copy[copy.length - 1] = `CloudAi: (stream error)`;
          return copy;
        });
      };
    } catch (err) {
      setStreaming(false);
      setResponses((rs) => [...rs, `CloudAi: Sorry, I couldn't start the stream.`]);
    } finally {
      setQuery("");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
      setStreaming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[720px] max-w-[95%]">
        <DialogHeader>
          <DialogTitle>CloudAi — General Assistant</DialogTitle>
          <DialogDescription>
            CloudAi provides general chat capabilities. This instance enforces safety filters and does not bypass legal or platform restrictions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">Sophistication: <span className="font-semibold">{sophistication.replace('-', ' ')}</span></div>
          <div className="text-xs text-muted-foreground">Advanced cloud assistant — high-context reasoning</div>
        </div>

        <div className="h-56 overflow-auto bg-background border border-border rounded p-2 text-sm mb-3">
          {responses.length === 0 ? (
            <p className="text-muted-foreground">No conversation yet. Ask CloudAi a question.</p>
          return (
            <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
              <DialogContent className="w-[720px] max-w-[95%] neon-flash">
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input

                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Model:</label>
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="px-2 py-1 bg-card border border-border rounded text-sm neon-item">
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4">gpt-4</option>
                      <option value="gpt-3.5">gpt-3.5</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Temperature:</label>
                    <input type="range" min={0} max={1} step={0.05} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-40" />
                    <div className="text-xs text-muted-foreground w-10 text-right">{temperature.toFixed(2)}</div>
                  </div>
                </div>

                <div className="h-56 overflow-auto bg-background border border-border rounded p-2 text-sm mb-3 neon-item">
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
                handleSend();
              }
            }}
          />
          <button type="submit" className="px-3 py-2 bg-primary text-primary-foreground rounded" disabled={!query.trim() || streaming}>
            {streaming ? "Streaming..." : "Send"}
          </button>
          {streaming && (
            <button type="button" onClick={stopStream} className="px-3 py-2 bg-destructive text-destructive-foreground rounded">Stop</button>
          )}
        </form>

        <DialogFooter>
          <div className="text-xs text-muted-foreground">CloudAi respects policy and safety filters.</div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloudAiModal;
