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
  sophistication?: "low" | "medium" | "high" | "very-high";
}

export const CloudAiModal: React.FC<Props> = ({ isOpen, onClose, sophistication = "very-high" }) => {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<EventSource | null>(null);
  const [model, setModel] = useState<string>("gpt-4o");
  const [temperature, setTemperature] = useState<number>(0.2);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    const userQ = query.trim();
    setResponses((rs) => [...rs, `You: ${userQ}`, `CloudAi: `]);
    setStreaming(true);
    try {
      const url = `/api/cloud-ai-stream?prompt=${encodeURIComponent(userQ)}` +
        `&sophistication=${encodeURIComponent(sophistication)}` +
        `&model=${encodeURIComponent(model)}` +
        `&temperature=${encodeURIComponent(String(temperature))}`;
      const es = new EventSource(url);
      streamRef.current = es;
      let acc = "";
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.chunk) {
            acc += payload.chunk;
            setResponses((rs) => {
              const copy = [...rs];
              copy[copy.length - 1] = `CloudAi: ${acc}`;
              return copy;
            });
          }
        } catch (err) {
          console.debug('CloudAiModal: non-json SSE chunk', err, ev.data);
        }
      };
      es.addEventListener("done", () => {
        setStreaming(false);
        es.close();
        streamRef.current = null;
      });
      es.onerror = () => {
        setStreaming(false);
        try { es.close(); } catch (err) { console.debug('CloudAiModal: failed to close EventSource', err); }
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
      try { streamRef.current.close(); } catch (err) { console.debug('CloudAiModal: stopStream close failed', err); }
      streamRef.current = null;
      setStreaming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[720px] max-w-[95%] neon-flash">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">🌐 CloudAi — Advanced Intelligence</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            State-of-the-art AI trained on vast knowledge bases. Expert-level reasoning in coding, analysis, writing, research, and creative problem-solving. Ethical and safety-aware.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mb-4 p-3 bg-card/50 border border-border rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">🤖 Model:</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="px-2 py-1.5 bg-background border border-border rounded text-xs neon-item hover:border-primary transition-colors">
                <option value="gpt-4o">GPT-4o (Latest)</option>
                <option value="gpt-4">GPT-4 (Advanced)</option>
                <option value="gpt-3.5">GPT-3.5 (Fast)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">⚙️ Response Style:</label>
              <select value={temperature.toString()} onChange={(e) => setTemperature(Number(e.target.value))} className="px-2 py-1.5 bg-background border border-border rounded text-xs neon-item hover:border-primary transition-colors">
                <option value="0">Focused (0.0)</option>
                <option value="0.3">Analytical (0.3)</option>
                <option value="0.7">Balanced (0.7)</option>
                <option value="1">Creative (1.0)</option>
              </select>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground bg-background px-2 py-1.5 rounded border border-border/50">
            ✨ Expertise: Code Generation • Data Analysis • Technical Writing • Math & Logic • Research Synthesis • Creative Problem-Solving
          </div>
        </div>

        <div className="h-56 overflow-auto bg-background border border-border rounded p-3 text-sm mb-3 neon-item space-y-2">
          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-xs font-semibold">Ask CloudAi anything</p>
              <p className="text-[11px] text-muted-foreground/70 mt-3 leading-relaxed">
                💻 Write & debug code • 📊 Analyze data • ✍️ Write content<br/>
                🔬 Research topics • 🧮 Solve math • 🎨 Creative projects
              </p>
            </div>
          ) : (
            responses.map((r, i) => (
              <div key={i} className={`mb-2 whitespace-pre-wrap px-2.5 py-1.5 rounded text-xs ${
                r.startsWith('You:') 
                  ? 'bg-primary/20 border-l-2 border-primary text-primary-foreground font-medium' 
                  : 'bg-card border-l-2 border-cyan-400/50 text-foreground'
              }`}>{r}</div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm"
            placeholder="Ask CloudAi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
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
          <div className="w-full">
            <div className="text-[11px] text-muted-foreground bg-blue-950/30 px-2.5 py-1.5 rounded border border-blue-400/20">
              ✅ Advanced reasoning • 📊 Multi-domain expertise • 💻 Production-grade output • 🛡️ Safety-aware • ⚡ Real-time streaming
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloudAiModal;
