import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Folder, FileText, Terminal, Settings, Image, Music, 
  Globe, Calculator, Clock, Wifi, Battery, 
  Volume2, X, Minus, Square, Search, Code, MessageSquare, LogOut
} from "lucide-react";
import { CodeEditor } from "@/components/desktop/CodeEditor";
import { FileManager } from "@/components/desktop/FileManager";
import { MusicPlayer } from "@/components/desktop/MusicPlayer";
import { GroupChat } from "@/components/desktop/GroupChat";
import { PhotoGallery } from "@/components/desktop/PhotoGallery";

interface Window {
  id: string;
  title: string;
  icon: React.ReactNode;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: React.ReactNode;
}

// Icon styling for realistic computer icons
const iconStyles: Record<string, { bg: string; iconColor: string }> = {
  files: { bg: "bg-gradient-to-br from-amber-400 to-amber-600", iconColor: "text-amber-900" },
  "code-editor": { bg: "bg-gradient-to-br from-blue-500 to-indigo-600", iconColor: "text-white" },
  terminal: { bg: "bg-gradient-to-br from-zinc-700 to-zinc-900", iconColor: "text-green-400" },
  browser: { bg: "bg-gradient-to-br from-sky-400 to-blue-600", iconColor: "text-white" },
  notes: { bg: "bg-gradient-to-br from-yellow-300 to-yellow-500", iconColor: "text-yellow-900" },
  music: { bg: "bg-gradient-to-br from-pink-500 to-rose-600", iconColor: "text-white" },
  chat: { bg: "bg-gradient-to-br from-emerald-400 to-teal-600", iconColor: "text-white" },
  calculator: { bg: "bg-gradient-to-br from-gray-600 to-gray-800", iconColor: "text-white" },
  photos: { bg: "bg-gradient-to-br from-purple-500 to-violet-600", iconColor: "text-white" },
  settings: { bg: "bg-gradient-to-br from-slate-500 to-slate-700", iconColor: "text-white" },
};

const desktopIcons = [
  { id: "files", name: "Files", icon: Folder },
  { id: "code-editor", name: "Code Editor", icon: Code },
  { id: "terminal", name: "Terminal", icon: Terminal },
  { id: "browser", name: "Browser", icon: Globe },
  { id: "notes", name: "Notes", icon: FileText },
  { id: "music", name: "Music", icon: Music },
  { id: "photos", name: "Photos", icon: Image },
  { id: "chat", name: "Chat", icon: MessageSquare },
  { id: "calculator", name: "Calculator", icon: Calculator },
  { id: "settings", name: "Settings", icon: Settings },
];

const Desktop = () => {
  const [windows, setWindows] = useState<Window[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const openWindow = (id: string, title: string, icon: React.ReactNode) => {
    const existingWindow = windows.find(w => w.id === id);
    if (existingWindow) {
      setActiveWindow(id);
      if (existingWindow.isMinimized) {
        setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: false } : w));
      }
      return;
    }

    const newWindow: Window = {
      id,
      title,
      icon,
      isMinimized: false,
      isMaximized: false,
      position: { x: 100 + windows.length * 30, y: 100 + windows.length * 30 },
      size: { width: 700, height: 500 },
      content: getWindowContent(id),
    };

    setWindows([...windows, newWindow]);
    setActiveWindow(id);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
    if (activeWindow === id) setActiveWindow(null);
  };

  const minimizeWindow = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: true } : w));
  };

  const maximizeWindow = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const getWindowContent = (id: string) => {
    switch (id) {
      case "code-editor":
        return <CodeEditor />;
      case "files":
        return <FileManager />;
      case "music":
        return <MusicPlayer />;
      case "chat":
        return <GroupChat />;
      case "photos":
        return <PhotoGallery />;
      case "terminal":
        return (
          <div className="h-full bg-black/90 p-4 font-mono text-sm text-primary">
            <p className="text-accent">CloudSpace Terminal v1.0.0</p>
            <p className="text-muted-foreground">Type 'help' for available commands</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-primary">user@cloudspace:~$</span>
              <span className="animate-pulse">▊</span>
            </div>
          </div>
        );
      case "browser":
        return (
          <div className="h-full flex flex-col bg-background">
            <div className="flex items-center gap-2 p-2 bg-card border-b border-border">
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Search or enter URL...</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Welcome to CloudSpace Browser</p>
            </div>
          </div>
        );
      case "notes":
        return (
          <div className="h-full bg-background p-4">
            <textarea 
              className="w-full h-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground"
              placeholder="Start typing your notes..."
            />
          </div>
        );
      case "calculator":
        return (
          <div className="h-full bg-background p-4 flex flex-col gap-2">
            <div className="bg-card p-4 rounded-lg text-right text-2xl font-mono text-foreground">0</div>
            <div className="grid grid-cols-4 gap-2 flex-1">
              {["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "="].map(btn => (
                <button 
                  key={btn} 
                  className={`rounded-lg font-medium transition-all hover:bg-primary/20 ${
                    ["÷", "×", "-", "+", "="].includes(btn) ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full flex items-center justify-center bg-background">
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Neon Gradient Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, hsl(280, 100%, 25%) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, hsl(200, 100%, 30%) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, hsl(320, 100%, 20%) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 70%, hsl(260, 100%, 20%) 0%, transparent 40%),
            linear-gradient(180deg, hsl(250, 50%, 8%) 0%, hsl(260, 40%, 5%) 100%)
          `,
        }}
      />
      
      {/* Animated Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: "radial-gradient(circle, hsl(280, 100%, 50%), transparent 70%)",
            top: "10%", 
            left: "5%",
            animation: "pulse 4s ease-in-out infinite"
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-25"
          style={{ 
            background: "radial-gradient(circle, hsl(180, 100%, 50%), transparent 70%)",
            top: "60%", 
            right: "10%",
            animation: "pulse 5s ease-in-out infinite 1s"
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ 
            background: "radial-gradient(circle, hsl(320, 100%, 50%), transparent 70%)",
            bottom: "20%", 
            left: "40%",
            animation: "pulse 6s ease-in-out infinite 2s"
          }}
        />
      </div>

      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 grid grid-cols-1 gap-3 z-10">
        {desktopIcons.map(({ id, name, icon: Icon }) => {
          const style = iconStyles[id] || { bg: "bg-primary", iconColor: "text-primary-foreground" };
          return (
            <button
              key={id}
              onClick={() => openWindow(id, name, <Icon className="w-4 h-4" />)}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <div 
                className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-200`}
                style={{ 
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                }}
              >
                <Icon className={`w-7 h-7 ${style.iconColor} drop-shadow-sm`} />
              </div>
              <span 
                className="text-xs text-white font-medium px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm"
                style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)" }}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Windows */}
      {windows.map(window => (
        !window.isMinimized && (
          <div
            key={window.id}
            onClick={() => setActiveWindow(window.id)}
            className={`absolute rounded-lg overflow-hidden border transition-all ${
              activeWindow === window.id ? "border-primary/50 shadow-2xl shadow-primary/20 z-50" : "border-border/50 shadow-xl z-40"
            }`}
            style={{
              left: window.isMaximized ? 0 : window.position.x,
              top: window.isMaximized ? 0 : window.position.y,
              width: window.isMaximized ? "100%" : window.size.width,
              height: window.isMaximized ? "calc(100% - 48px)" : window.size.height,
            }}
          >
            <div className="h-10 bg-card/95 backdrop-blur-xl border-b border-border flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <span className="text-primary">{window.icon}</span>
                <span className="text-sm font-medium text-foreground">{window.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); minimizeWindow(window.id); }} className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="w-3 h-3 text-muted-foreground" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); maximizeWindow(window.id); }} className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors">
                  <Square className="w-3 h-3 text-muted-foreground" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }} className="w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors">
                  <X className="w-3 h-3 text-destructive" />
                </button>
              </div>
            </div>
            <div className="h-[calc(100%-40px)] overflow-auto">{window.content}</div>
          </div>
        )
      ))}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-card/80 backdrop-blur-xl border-t border-primary/30 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <button 
            className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center hover:bg-primary/30 transition-all"
            style={{ boxShadow: "0 0 15px hsl(var(--primary) / 0.3)" }}
          >
            <div className="w-5 h-5 border-2 border-primary rounded-sm" />
          </button>
          <button onClick={handleLogout} className="w-10 h-10 rounded-lg bg-card/50 border border-border/50 flex items-center justify-center hover:bg-destructive/20 transition-all">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2">
          {windows.map(window => (
            <button
              key={window.id}
              onClick={() => {
                if (window.isMinimized) {
                  setWindows(windows.map(w => w.id === window.id ? { ...w, isMinimized: false } : w));
                }
                setActiveWindow(window.id);
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeWindow === window.id && !window.isMinimized ? "bg-primary/20 border border-primary/50" : "bg-card/50 border border-border/50 hover:bg-card"
              }`}
            >
              <span className="text-primary">{window.icon}</span>
              <span className="text-sm text-foreground">{window.title}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Wifi className="w-4 h-4 text-muted-foreground" />
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Battery className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Desktop;
