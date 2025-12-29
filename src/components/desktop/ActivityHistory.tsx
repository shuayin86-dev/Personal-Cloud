import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

export const ActivityHistory = ({ isOpen, onClose, userId }: { isOpen: boolean; onClose: () => void; userId?: string }) => {
  const [items, setItems] = useState<Array<{ id: string; type: string; message: string; created_at: string }>>([]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    (async () => {
      const { data } = await (supabase as any).from('user_activity').select('id, type, message, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
      setItems((data as any) || []);
    })();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-2xl shadow-2xl p-4 neon-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Activity History</h3>
          <button onClick={onClose} className="p-2 rounded bg-black/20"><X /></button>
        </div>
        <div className="space-y-2 max-h-96 overflow-auto">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="p-3 bg-background/50 rounded neon-item">
                <div className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString()}</div>
                <div className="text-sm">{it.type}: {it.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
