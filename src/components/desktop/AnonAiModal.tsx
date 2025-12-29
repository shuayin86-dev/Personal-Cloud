import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
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

export const AnonAiModal: React.FC<Props> = ({ isOpen, onClose, sophistication = 'very-high' }) => {
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<string[]>([]);
  const [terminalMode, setTerminalMode] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string>("gpt-4o");
  const [temperature, setTemperature] = useState<number>(0.2);
  const [paneHeight, setPaneHeight] = useState<number>(220);
  const draggingRef = useRef(false);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    const userQ = query.trim();
    setLoading(true);

    // Use EventSource streaming via GET to /api/anon-ai?stream=1
    // Append initial user message and an empty response slot to be filled incrementally.
    setResponses((r) => [...r, `You: ${userQ}`, `Anon Ai (defensive): `]);
    const responseIndex = (responses.length) + 1; // index of the response to update

    // Build URL with encoded params
    const params = new URLSearchParams();
    params.set('stream', '1');
    params.set('model', model);
    params.set('temperature', String(temperature));
    params.set('prompt', userQ);
    const url = `/api/anon-ai?${params.toString()}`;

    let es: EventSource | null = null;
    try {
      es = new EventSource(url);
      let buffer = '';
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data || '{}');
          const chunk = payload?.chunk || '';
          if (chunk) {
            buffer += chunk;
            // update the last response in state
            setResponses((prev) => {
              const copy = [...prev];
              copy[responseIndex] = `Anon Ai (defensive): ${buffer}`;
              return copy;
            });
          }
        } catch (err) {
          // non-json payload — append raw
          buffer += ev.data;
          setResponses((prev) => {
            const copy = [...prev];
            copy[responseIndex] = `Anon Ai (defensive): ${buffer}`;
            return copy;
          });
        }
      };
      es.addEventListener('done', () => {
        setLoading(false);
        es?.close();
        es = null;
      });
      es.onerror = (err) => {
        setLoading(false);
        es?.close();
        es = null;
        setResponses((r) => {
          const copy = [...r];
          copy[responseIndex] = (copy[responseIndex] || '') + '\n\n[Stream error]';
          return copy;
        });
      };
    } catch (err) {
      // fallback: non-streaming POST
      try {
        const res = await fetch('/api/anon-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userQ, sophistication, model, temperature }),
        });
        let text = '';
        try {
          const data = await res.json();
          text = data?.text || data?.response || JSON.stringify(data);
        } catch (e) {
          text = await res.text();
        }
        setResponses((r) => {
          const copy = [...r];
          copy[responseIndex] = `Anon Ai (defensive): ${text}`;
          return copy;
        });
      } catch (e) {
        setResponses((r) => {
          const copy = [...r];
          copy[responseIndex] = `Anon Ai (defensive): I can help with defensive cybersecurity tasks — recommend tooling and workflows for auditing, suggest safe log-analysis approaches, and outline forensic data collection best practices. You asked: "${userQ}"`;
          return copy;
        });
      } finally {
        setLoading(false);
      }
    } finally {
      setQuery('');
    }
  };

  const handleTerminalSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    const cmd = query.trim();
    setLoading(true);
    // Stream terminal-like response via EventSource to /api/anon-ai?stream=1
    let entryIndex = -1;
    setTerminalHistory((prev) => {
      entryIndex = prev.length;
      return [...prev, { cmd, out: '' }];
    });

    const params = new URLSearchParams();
    params.set('stream', '1');
    params.set('model', model);
    params.set('temperature', String(temperature));
    const prompt = `Act AS A TERMINAL: emulate execution of the following command and output only the result (no extra commentary). Command: ${cmd}`;
    params.set('prompt', prompt);
    const url = `/api/anon-ai?${params.toString()}`;

    let es: EventSource | null = null;
    try {
      es = new EventSource(url);
      let buffer = '';
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data || '{}');
          const chunk = payload?.chunk || '';
          if (chunk) {
            buffer += chunk;
            setTerminalHistory((prev) => {
              const copy = [...prev];
              if (entryIndex >= 0 && entryIndex < copy.length) {
                copy[entryIndex] = { ...copy[entryIndex], out: buffer };
              }
              return copy;
            });
          }
        } catch (err) {
          buffer += ev.data;
          setTerminalHistory((prev) => {
            const copy = [...prev];
            if (entryIndex >= 0 && entryIndex < copy.length) {
              copy[entryIndex] = { ...copy[entryIndex], out: buffer };
            }
            return copy;
          });
        }
      };
      es.addEventListener('done', () => {
        setLoading(false);
        es?.close();
        es = null;
      });
      es.onerror = (err) => {
        setLoading(false);
        es?.close();
        es = null;
        setTerminalHistory((prev) => {
          const copy = [...prev];
          if (entryIndex >= 0 && entryIndex < copy.length) {
            copy[entryIndex] = { ...copy[entryIndex], out: (copy[entryIndex].out || '') + '\n\n[Stream error]' };
          }
          return copy;
        });
      };
    } catch (err) {
      // fallback to POST
      try {
        const res = await fetch('/api/anon-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, sophistication, model, temperature }),
        });
        let text = '';
        try {
          const data = await res.json();
          text = data?.text || data?.response || JSON.stringify(data);
        } catch (e) {
          text = await res.text();
        }
        setTerminalHistory((prev) => {
          const copy = [...prev];
          if (entryIndex >= 0 && entryIndex < copy.length) {
            copy[entryIndex] = { ...copy[entryIndex], out: text };
          }
          return copy;
        });
      } catch (e) {
        setTerminalHistory((prev) => {
          const copy = [...prev];
          if (entryIndex >= 0 && entryIndex < copy.length) {
            copy[entryIndex] = { ...copy[entryIndex], out: 'Error: backend unreachable' };
          }
          return copy;
        });
      } finally {
        setLoading(false);
      }
    } finally {
      setQuery('');
    }
  };

  // Drag handlers for adjustable split
  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const dy = ev.clientY - startYRef.current;
      const next = Math.max(120, Math.min(720, startHeightRef.current + dy));
      setPaneHeight(next);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Keyboard shortcuts: Ctrl/Cmd+Enter send, Ctrl/Cmd+K focus, Esc close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (terminalMode) handleTerminalSend(); else handleSend();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, terminalMode, query]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[720px] max-w-[95%] neon-flash">
        <DialogHeader>
          <DialogTitle>Anon Ai — Defensive Cybersecurity Assistant</DialogTitle>
          <DialogDescription>
            Specifically built for cybersecurity professionals, ethical hackers, and digital forensics experts. Anon Ai provides high-level, defensive guidance and tool recommendations. It does not provide or facilitate illegal or harmful actions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setTerminalMode(false)} className={`px-2 py-1 rounded ${!terminalMode ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>Chat</button>
            <button onClick={() => setTerminalMode(true)} className={`px-2 py-1 rounded ${terminalMode ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>Terminal</button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Model:</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="px-2 py-1 bg-card border border-border rounded text-sm neon-item">
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4">gpt-4</option>
              <option value="gpt-3.5">gpt-3.5</option>
            </select>
            <label className="text-xs text-muted-foreground ml-2">Temp:</label>
            <input type="range" min={0} max={1} step={0.05} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-36" />
            <div className="text-xs text-muted-foreground w-10 text-right">{temperature.toFixed(2)}</div>
          </div>
        </div>

        {!terminalMode ? (
          <>
            <div style={{ height: paneHeight }} className="overflow-auto bg-background border border-border rounded p-2 text-sm mb-1 neon-item">
              {responses.length === 0 ? (
                <p className="text-muted-foreground">No conversation yet. Ask a defensive cybersecurity question.</p>
              ) : (
                responses.map((r, i) => (
                  <div key={i} className="mb-2 whitespace-pre-wrap">{r}</div>
                ))
              )}
            </div>
            <div
              onMouseDown={(e) => {
                draggingRef.current = true;
                startYRef.current = e.clientY;
                startHeightRef.current = paneHeight;
              }}
              className="h-1 mb-2 cursor-row-resize bg-border/50"
            />

            <form onSubmit={handleSend} className="flex gap-2">
              <input
                ref={inputRef}
                className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm neon-border"
                placeholder="Ask Anon Ai (defensive topics only)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button type="submit" className="px-3 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50" disabled={!query.trim() || loading}>
                {loading ? "Thinking..." : "Ask"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="h-48 overflow-auto bg-black text-green-300 font-mono border border-border rounded p-2 text-sm mb-3">
              {terminalHistory.length === 0 ? (
                <div className="text-muted-foreground">Terminal ready. Type a command below (simulated).</div>
              ) : (
                terminalHistory.map((t, i) => (
                  <div key={i} className="mb-2">
                    <div className="text-[12px] text-pink-300">$ {t.cmd}</div>
                    <pre className="whitespace-pre-wrap text-[13px]">{t.out}</pre>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleTerminalSend} className="flex gap-2">
              <input
                ref={inputRef}
                className="flex-1 px-3 py-2 bg-black border border-border rounded text-sm text-green-300 font-mono"
                placeholder="simulate> ls -la"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTerminalSend();
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const last = terminalHistory[terminalHistory.length - 1]?.cmd || '';
                    setQuery(last);
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setQuery('');
                  }
                }}
              />
              <button type="submit" className="px-3 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50" disabled={!query.trim() || loading}>
                {loading ? "Running..." : "Run"}
              </button>
            </form>
          </>
        )}

        <DialogFooter>
          <div className="text-xs text-muted-foreground">Responses are high-level and defensive only.</div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnonAiModal;
