import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { KaliLinuxTerminal } from "./KaliLinuxTerminal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KaliLinuxTerminalModal = ({ isOpen, onClose }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0 gap-0 bg-black/95 border border-red-600/50">
        <DialogHeader className="border-b border-red-600/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-red-400 font-bold">KaliGpt Security Terminal</DialogTitle>
              <DialogDescription className="text-red-400/70">
                ⚠️ Authorized Penetration Testing & Legal Security Auditing Only
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-red-600/20 hover:bg-red-600/40 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <KaliLinuxTerminal />
        </div>
      </DialogContent>
    </Dialog>
  );
};
