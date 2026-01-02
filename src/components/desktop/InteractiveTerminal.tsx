import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface CommandOutput {
  command: string;
  output: string[];
  isError?: boolean;
}

interface InteractiveTerminalProps {
  username?: string;
}

export const InteractiveTerminal = ({ username = "user" }: InteractiveTerminalProps) => {
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState("~");
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const fileSystem: Record<string, string[]> = {
    "~": ["Documents", "Downloads", "Pictures", "Music", ".bashrc"],
    "~/Documents": ["notes.txt", "projects", "readme.md"],
    "~/Downloads": ["file1.zip", "image.png"],
    "~/Pictures": ["wallpaper.jpg", "screenshot.png"],
    "~/Music": ["song1.mp3", "song2.mp3"],
    "~/Documents/projects": ["webapp", "api"],
  };

  const fileContents: Record<string, string> = {
    "~/.bashrc": "# CloudSpace Terminal Configuration\nexport PS1='\\u@cloudspace:\\w$ '\nalias ll='ls -la'",
    "~/Documents/notes.txt": "Welcome to CloudSpace!\nThis is your personal cloud desktop.",
    "~/Documents/readme.md": "# CloudSpace\n\nYour virtual desktop in the cloud.\n\n## Features\n- File management\n- Code editor\n- Music player\n- And more!",
  };

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resolvePath = (path: string): string => {
    if (path.startsWith("~/")) return path;
    if (path === "~") return "~";
    if (path.startsWith("/")) return path;
    if (path === "..") {
      const parts = currentDir.split("/");
      if (parts.length > 1) {
        parts.pop();
        return parts.join("/") || "~";
      }
      return "~";
    }
    if (path === ".") return currentDir;
    return currentDir === "~" ? `~/${path}` : `${currentDir}/${path}`;
  };

  const executeCommand = (cmd: string): { output: string[]; isError?: boolean } => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "help":
        return {
          output: [
            "═══════════════════════════════════════════════════════════",
            "Available commands:",
            "═══════════════════════════════════════════════════════════",
            "",
            "📂 File System:",
            "  ls [dir]      - List directory contents",
            "  cd <dir>      - Change directory",
            "  pwd           - Print working directory",
            "  cat <file>    - Display file contents",
            "",
            "📝 Text:",
            "  echo <text>   - Print text to terminal",
            "  whoami        - Display current user",
            "",
            "🔧 System:",
            "  date          - Display current date/time",
            "  uname         - System information",
            "  neofetch      - Display system info",
            "  clear         - Clear the terminal",
            "  history       - Show command history",
            "",
            "🛡️ Kali Linux Security Tools:",
            "  nmap <host>   - Network mapper (scan ports/services)",
            "  whois <host>  - Domain/IP lookup",
            "  netstat       - Network statistics",
            "  ifconfig      - Network configuration",
            "  ping <host>   - Test host connectivity",
            "  traceroute    - Trace network path",
            "  dig <host>    - DNS lookup",
            "  aircrack-ng   - WiFi security auditing",
            "  hashcat       - Password hash cracking",
            "  sqlmap        - SQL injection testing",
            "  metasploit    - Penetration testing framework",
            "",
            "⚠️  Note: These are educational simulations. Use ethically & legally.",
            "═══════════════════════════════════════════════════════════",
          ],
        };

      case "ls": {
        const lsPath = args[0] ? resolvePath(args[0]) : currentDir;
        const contents = fileSystem[lsPath];
        if (!contents) {
          return { output: [`ls: cannot access '${args[0] || "."}': No such file or directory`], isError: true };
        }
        return {
          output: contents.map(item => 
            fileSystem[lsPath === "~" ? `~/${item}` : `${lsPath}/${item}`] 
              ? `📁 ${item}/` 
              : `📄 ${item}`
          ),
        };
      }

      case "cd": {
        if (!args[0] || args[0] === "~") {
          setCurrentDir("~");
          return { output: [] };
        }
        const cdPath = resolvePath(args[0]);
        if (fileSystem[cdPath]) {
          setCurrentDir(cdPath);
          return { output: [] };
        }
        return { output: [`cd: ${args[0]}: No such file or directory`], isError: true };
      }

      case "pwd":
        return { output: [currentDir.replace("~", "/home/" + username)] };

      case "cat": {
        if (!args[0]) {
          return { output: ["cat: missing file operand"], isError: true };
        }
        const catPath = resolvePath(args[0]);
        const content = fileContents[catPath];
        if (content) {
          return { output: content.split("\n") };
        }
        return { output: [`cat: ${args[0]}: No such file or directory`], isError: true };
      }

      case "echo":
        return { output: [args.join(" ")] };

      case "whoami":
        return { output: [username] };

      case "date":
        return { output: [new Date().toString()] };

      case "clear":
        setHistory([]);
        return { output: [] };

      case "uname":
        if (args[0] === "-a") {
          return { output: ["CloudSpace 1.0.0 cloudspace-kernel x86_64 GNU/Linux"] };
        }
        return { output: ["CloudSpace"] };

      case "neofetch":
        return {
          output: [
            "       ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄       " + username + "@cloudspace",
            "     ▄▀░░░░░░░░░░░░░░░░░░▀▄     ──────────────────",
            "    █░░░░░░░░░░░░░░░░░░░░░░█    OS: CloudSpace 1.0",
            "   █░░░░░░░░░░░░░░░░░░░░░░░░█   Host: Virtual Desktop",
            "  █░░░░░░░░░░░░░░░░░░░░░░░░░░█  Kernel: cloudspace-1.0",
            "  █░░░▀▀▀░░░░░░░░░░░▀▀▀░░░░░█  Uptime: Just now",
            "  █░░░░░░░░░░░░░░░░░░░░░░░░░█  Shell: csh 1.0",
            "  █░░░░░░░░░░░░░░░░░░░░░░░░░█  Terminal: CloudSpace",
            "   █░░░░░░░░░░░░░░░░░░░░░░░█   Memory: ∞ GB",
            "    ▀▄░░░░░░░░░░░░░░░░░░▄▀    ",
            "      ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀       ",
          ],
        };

      case "history":
        return {
          output: commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`),
        };

      case "nmap": {
        if (!args[0]) {
          return { output: ["nmap: No host specified. Usage: nmap <host>"], isError: true };
        }
        const host = args[0];
        return {
          output: [
            `Starting Nmap 7.92 ( https://nmap.org ) at ${new Date().toLocaleString()}`,
            `Nmap scan report for ${host}`,
            `Host is up (0.045s latency).`,
            "",
            "PORT     STATE    SERVICE",
            "22/tcp   open     ssh",
            "80/tcp   open     http",
            "443/tcp  open     https",
            "3306/tcp filtered mysql",
            "5432/tcp filtered postgresql",
            "8080/tcp filtered http-proxy",
            "",
            "Nmap done at ${new Date().toLocaleString()}; 1 IP address (1 host up) scanned in 2.34 seconds",
          ],
        };
      }

      case "whois": {
        if (!args[0]) {
          return { output: ["whois: domain/IP required. Usage: whois <domain|ip>"], isError: true };
        }
        const query = args[0];
        return {
          output: [
            `Whois Server: whois.iana.org`,
            `Referral URL: whois.example.com`,
            "",
            `Domain Name: ${query.toUpperCase()}`,
            `Registry Domain ID: D123456789-LROR`,
            `Registrar WHOIS Server: whois.example.com`,
            `Registrar URL: http://www.example.com`,
            `Updated Date: 2024-01-02T10:30:00Z`,
            `Creation Date: 2020-05-15T14:20:00Z`,
            `Registry Expiry Date: 2026-05-15T14:20:00Z`,
            `Registrant Country: US`,
            `Admin Email: admin@example.com`,
            `Tech Email: tech@example.com`,
            `Name Server: ns1.example.com`,
            `Name Server: ns2.example.com`,
            `DNSSEC: unsigned`,
          ],
        };
      }

      case "netstat": {
        return {
          output: [
            "Active Internet connections (tcp)",
            "Proto Recv-Q Send-Q Local Address           Foreign Address         State",
            "tcp        0      0 127.0.0.1:5432         0.0.0.0:*               LISTEN",
            "tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN",
            "tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN",
            "tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN",
            "tcp        0      0 192.168.1.100:56234     142.250.80.46:443       ESTABLISHED",
            "tcp        1      0 192.168.1.100:45678     172.217.21.46:443       CLOSE_WAIT",
          ],
        };
      }

      case "ifconfig": {
        return {
          output: [
            "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>",
            "      inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255",
            "      inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>",
            "      ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)",
            "      RX packets 12456  bytes 9876543 (9.4 MiB)",
            "      RX errors 0  dropped 0  overruns 0  frame 0",
            "      TX packets 8901  bytes 5432109 (5.2 MiB)",
            "      TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0",
            "",
            "lo: flags=73<UP,LOOPBACK,RUNNING>",
            "      inet 127.0.0.1  netmask 255.0.0.0",
            "      inet6 ::1  prefixlen 128  scopeid 0x10<host>",
            "      loop  txqueuelen 1000  (Local Loopback)",
            "      RX packets 246  bytes 20483 (20.0 KiB)",
            "      TX packets 246  bytes 20483 (20.0 KiB)",
          ],
        };
      }

      case "ping": {
        if (!args[0]) {
          return { output: ["ping: usage error: Destination host required"], isError: true };
        }
        return {
          output: [
            `PING ${args[0]} (192.0.2.1) 56(84) bytes of data.`,
            `64 bytes from 192.0.2.1: icmp_seq=1 ttl=63 time=12.4 ms`,
            `64 bytes from 192.0.2.1: icmp_seq=2 ttl=63 time=11.8 ms`,
            `64 bytes from 192.0.2.1: icmp_seq=3 ttl=63 time=13.2 ms`,
            `64 bytes from 192.0.2.1: icmp_seq=4 ttl=63 time=12.1 ms`,
            "",
            `--- ${args[0]} statistics ---`,
            `4 packets transmitted, 4 received, 0% packet loss, time 1003ms`,
            `rtt min/avg/max/stddev = 11.8/12.4/13.2/0.5 ms`,
          ],
        };
      }

      case "traceroute": {
        if (!args[0]) {
          return { output: ["traceroute: No destination specified"], isError: true };
        }
        return {
          output: [
            `traceroute to ${args[0]} (192.0.2.1), 30 hops max, 60 byte packets`,
            ` 1  192.168.1.1 (192.168.1.1)  1.234 ms  1.123 ms  1.456 ms`,
            ` 2  10.0.0.1 (10.0.0.1)  5.432 ms  5.210 ms  5.678 ms`,
            ` 3  203.0.113.5 (203.0.113.5)  12.345 ms  12.543 ms  12.123 ms`,
            ` 4  198.51.100.1 (198.51.100.1)  18.765 ms  19.234 ms  18.456 ms`,
            ` 5  ${args[0]} (192.0.2.1)  21.432 ms  21.123 ms  21.678 ms`,
          ],
        };
      }

      case "dig": {
        if (!args[0]) {
          return { output: ["dig: invalid option -- no query"], isError: true };
        }
        return {
          output: [
            `; <<>> DiG 9.16.1-Ubuntu <<>> ${args[0]}`,
            `; (1 server found)`,
            `;; global options: +cmd`,
            `;; Got answer:`,
            `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345`,
            `; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 2, ADDITIONAL: 0`,
            "",
            `;; QUESTION SECTION:`,
            `;${args[0]}.                    IN      A`,
            "",
            `;; ANSWER SECTION:`,
            `${args[0]}.             300     IN      A       192.0.2.1`,
            "",
            `;; AUTHORITY SECTION:`,
            `example.com.            172800  IN      NS      ns1.example.com.`,
            `example.com.            172800  IN      NS      ns2.example.com.`,
            "",
            `;; Query time: 45 msec`,
            `;; SERVER: 8.8.8.8#53(8.8.8.8)`,
            `;; WHEN: ${new Date().toUTCString()}`,
            `;; MSG SIZE  rcvd: 123`,
          ],
        };
      }

      case "aircrack-ng": {
        return {
          output: [
            "Aircrack-ng 1.7",
            "[*] Reading from pcap dump file cap.pcap",
            "[*] Found 2 WPA Handshakes:",
            "",
            "BSSID              Essid                    Attempts  #Data IVs  LAN IP",
            "00:1A:2B:3C:4D:5E  NetworkName1            12345     8934      No",
            "00:2B:3C:4D:5E:6F  NetworkName2            54321     12456     No",
            "",
            "Password not found. Try with a different wordlist.",
            "Tried 234567 out of 987654 passwords (23.7% complete)",
          ],
        };
      }

      case "hashcat": {
        if (!args[0]) {
          return { output: ["hashcat: No hash provided"], isError: true };
        }
        return {
          output: [
            "hashcat (v6.2.6) starting in autodetect mode...",
            `Hash: ${args[0]}`,
            "Hash.Type: Not identified (requires --mode or .hcstat2 file)",
            "",
            "[*] Hash mode auto-detected as 0 (MD5)",
            "[*] Initialized with OpenCL 2.1 (Intel)",
            "[*] Cracking: 1 hash in 1 saltless iteration",
            "",
            "Candidates.#1.........: xxxxxxxx",
            "Candidates.#2.........: password123",
            "Candidates.Status.......: 23.4%",
            "Speed.#1.........: 4500.0 kH/s",
            "",
            "Note: Educational simulation only.",
          ],
        };
      }

      case "sqlmap": {
        if (!args[0]) {
          return { output: ["sqlmap: URL parameter required"], isError: true };
        }
        return {
          output: [
            `sqlmap/1.6.8#dev - automatic SQL injection and database takeover tool`,
            `Target: ${args[0]}`,
            "[*] Testing connection to the target URL",
            "[*] Heuristic (basic) test shows that GET parameter 'id' might be vulnerable to SQL injection attacks",
            "[*] Testing 'AND boolean-based blind - WHERE or HAVING clause'",
            "[*] Testing 'MySQL >= 5.0 AND time-based blind'",
            "[*] GET parameter 'id' appears to be vulnerable to SQL injection attacks",
            "",
            "Parameter: id",
            "Type: AND/OR time-based blind",
            "Title: MySQL >= 5.0.12 AND time-based blind",
            "Payload: 1 AND SLEEP(5)",
            "",
            "⚠️  Only test on systems you have permission to test!",
          ],
        };
      }

      case "metasploit": {
        return {
          output: [
            "       =[ metasploit v6.2.24 ]",
            "+ -- --=[ 2224 exploits - 1164 auxiliary - 402 post ]",
            "+ -- --=[ 603 payloads - 45 encoders - 11 nops ]",
            "+ -- --=[ 9 evasion ]",
            "",
            "msf6 > help",
            "",
            "Core Commands",
            "=============",
            "    Command       Description",
            "    -------       -----------",
            "    use           Load a module",
            "    set           Set a variable",
            "    run/exploit   Execute the selected module",
            "    show          Display module or global options",
            "    back          Go back to the main prompt",
            "",
            "⚠️  For authorized penetration testing only!",
          ],
        };
      }

      case "":
        return { output: [] };

      default:
        return { output: [`${command}: command not found. Type 'help' for available commands.`], isError: true };
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const result = executeCommand(currentInput);
      
      if (currentInput.trim() && currentInput.trim() !== "clear") {
        setHistory(prev => [...prev, { command: currentInput, ...result }]);
        setCommandHistory(prev => [...prev, currentInput]);
      }
      
      setCurrentInput("");
      setHistoryIndex(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple tab completion for current directory
      const contents = fileSystem[currentDir] || [];
      const match = contents.find(item => item.startsWith(currentInput.split(/\s+/).pop() || ""));
      if (match) {
        const parts = currentInput.split(/\s+/);
        parts[parts.length - 1] = match;
        setCurrentInput(parts.join(" "));
      }
    }
  };

  return (
    <div 
      ref={terminalRef}
      className="h-full bg-black/95 p-4 font-mono text-sm overflow-auto cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <p className="text-cyan-400">CloudSpace Terminal v1.0.0</p>
      <p className="text-muted-foreground mb-2">Type 'help' for available commands</p>
      
      {history.map((entry, i) => (
        <div key={i} className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400">{username}@cloudspace</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-blue-400">{currentDir}</span>
            <span className="text-muted-foreground">$</span>
            <span className="text-foreground">{entry.command}</span>
          </div>
          {entry.output.map((line, j) => (
            <p key={j} className={entry.isError ? "text-red-400 pl-0" : "text-foreground/80 pl-0"}>
              {line}
            </p>
          ))}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <span className="text-green-400">{username}@cloudspace</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-blue-400">{currentDir}</span>
        <span className="text-muted-foreground">$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-foreground caret-primary"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};
