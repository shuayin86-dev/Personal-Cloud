import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface CommandOutput {
  command: string;
  output: string[];
  isError?: boolean;
}

export const KaliLinuxTerminal = () => {
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = (cmd: string): { output: string[]; isError?: boolean } => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "help":
        return {
          output: [
            "═══════════════════════════════════════════════════════════",
            "KaliGpt Legal Security Tools - Admin Panel",
            "═══════════════════════════════════════════════════════════",
            "",
            "🛡️ Defensive Security:",
            "  nmap <host>         - Network reconnaissance & port scanning",
            "  whois <domain>      - Domain/IP information lookup",
            "  netstat             - Active network connections",
            "  ifconfig            - Network interface info",
            "  ping <host>         - Test connectivity & latency",
            "  traceroute <host>   - Network path analysis",
            "  dig <host>          - DNS queries & records",
            "",
            "🔍 Vulnerability Assessment:",
            "  aircrack-ng         - WiFi security audit (authorized only)",
            "  sqlmap <target>     - SQL injection assessment",
            "  nmap -sV <host>     - Service version detection",
            "",
            "🔐 Hash & Forensics:",
            "  hashcat <hash>      - Hash analysis & cracking (authorized)",
            "  md5sum <file>       - File integrity verification",
            "",
            "📊 Penetration Testing:",
            "  metasploit          - PT framework reference",
            "  report              - Generate security assessment report",
            "",
            "⚠️  LEGAL & ETHICAL:",
            "  auth-check          - Verify authorized testing scope",
            "  compliance          - Show OWASP/NIST guidelines",
            "  legal-notice        - Display legal disclaimer",
            "",
            "ℹ️  All tools require proper authorization. Unauthorized access is illegal.",
            "═══════════════════════════════════════════════════════════",
          ],
        };

      case "nmap": {
        if (!args[0]) {
          return { output: ["nmap: No host specified. Usage: nmap <host> or nmap -sV <host>"], isError: true };
        }
        const isServiceScan = args[0] === "-sV";
        const host = isServiceScan ? args[1] : args[0];
        return {
          output: [
            `Starting Nmap 7.92 ( https://nmap.org ) at ${new Date().toLocaleString()}`,
            `Nmap scan report for ${host}`,
            `Host is up (0.045s latency).`,
            "",
            "PORT     STATE    SERVICE" + (isServiceScan ? "         VERSION" : ""),
            "22/tcp   open     ssh" + (isServiceScan ? "              OpenSSH 7.4p1" : ""),
            "80/tcp   open     http" + (isServiceScan ? "             Apache 2.4.6" : ""),
            "443/tcp  open     https" + (isServiceScan ? "            Apache 2.4.6" : ""),
            "3306/tcp filtered mysql" + (isServiceScan ? "            -" : ""),
            "",
            "ℹ️  Nmap results. Always verify proper authorization before scanning.",
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
            `Whois lookup for: ${query}`,
            "",
            `Domain Name: ${query.toUpperCase()}`,
            `Registry Domain ID: D123456789-LROR`,
            `Registrar WHOIS Server: whois.registrar.com`,
            `Updated Date: 2024-01-02T10:30:00Z`,
            `Creation Date: 2020-05-15T14:20:00Z`,
            `Registry Expiry Date: 2026-05-15T14:20:00Z`,
            `Registrant Country: US`,
            `Name Server: ns1.example.com (192.0.2.1)`,
            `Name Server: ns2.example.com (192.0.2.2)`,
            `DNSSEC: unsigned`,
            "",
            "ℹ️  Use for authorized reconnaissance only.",
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
            "",
            "ℹ️  Shows active network connections and listening ports.",
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
            "",
            "ℹ️  Network interface configuration on authorized systems.",
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
            "",
            `--- ${args[0]} statistics ---`,
            `3 packets transmitted, 3 received, 0% packet loss, time 1003ms`,
            `rtt min/avg/max/stddev = 11.8/12.4/13.2/0.5 ms`,
            "",
            "ℹ️  Connectivity test (requires authorization).",
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
            ` 4  ${args[0]} (192.0.2.1)  21.432 ms  21.123 ms  21.678 ms`,
            "",
            "ℹ️  Network path analysis for authorized reconnaissance.",
          ],
        };
      }

      case "dig": {
        if (!args[0]) {
          return { output: ["dig: invalid option -- no query"], isError: true };
        }
        const host = args[0];
        return {
          output: [
            `; <<>> DiG 9.16.1 <<>> ${host}`,
            `; global options: +cmd`,
            `;; Got answer:`,
            `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345`,
            "",
            `;; QUESTION SECTION:`,
            `;${host}.                    IN      A`,
            "",
            `;; ANSWER SECTION:`,
            `${host}.             300     IN      A       192.0.2.1`,
            "",
            `;; AUTHORITY SECTION:`,
            `example.com.            172800  IN      NS      ns1.example.com.`,
            "",
            `;; Query time: 45 msec`,
            `;; SERVER: 8.8.8.8#53(8.8.8.8)`,
            `;; WHEN: ${new Date().toUTCString()}`,
            "",
            "ℹ️  DNS lookups for authorized testing.",
          ],
        };
      }

      case "aircrack-ng": {
        return {
          output: [
            "Aircrack-ng 1.7 (WiFi Security Audit Tool)",
            "",
            "⚠️  AUTHORIZATION REQUIRED",
            "This tool is for authorized WiFi security testing only.",
            "Unauthorized network testing is ILLEGAL under:",
            "  • Computer Fraud and Abuse Act (CFAA)",
            "  • Digital Millennium Copyright Act (DMCA)",
            "  • Local telecommunications laws",
            "",
            "✅ AUTHORIZED USES:",
            "  • Testing on networks you own",
            "  • Testing with explicit written permission",
            "  • Contracted penetration testing",
            "  • Educational labs with approved systems",
            "",
            "[*] Waiting for authorization verification...",
            "Usage: aircrack-ng -w wordlist.txt capture.cap",
          ],
        };
      }

      case "sqlmap": {
        if (!args[0]) {
          return { output: ["sqlmap: target URL required"], isError: true };
        }
        return {
          output: [
            `sqlmap/1.6.8#dev - SQL Injection Testing Tool`,
            `Target: ${args[0]}`,
            "",
            "⚠️  AUTHORIZATION REQUIRED",
            "SQL injection testing must be authorized. Unauthorized testing is illegal.",
            "",
            "✅ LEGAL AUTHORIZED TESTING:",
            "  [*] Testing against YOUR OWN applications",
            "  [*] Testing with explicit written authorization",
            "  [*] Contracted security assessment",
            "",
            "[!] Verify authorization before proceeding",
            "Usage: sqlmap -u 'target' --batch --dbs",
          ],
        };
      }

      case "hashcat": {
        if (!args[0]) {
          return { output: ["hashcat: hash value required"], isError: true };
        }
        return {
          output: [
            "hashcat (v6.2.6) - Advanced Hash Cracking",
            `Hash: ${args[0]}`,
            "",
            "⚠️  LEGAL AUTHORIZATION REQUIRED",
            "Only crack hashes from:",
            "  ✅ Systems you own",
            "  ✅ Systems with written authorization",
            "  ✅ Legitimate security testing",
            "",
            "❌ ILLEGAL USES:",
            "  ✗ Unauthorized password recovery",
            "  ✗ Accessing others' accounts",
            "  ✗ Brute-forcing without permission",
            "",
            "[*] Verify authorization scope before execution",
            "Usage: hashcat -m 0 hashes.txt wordlist.txt",
          ],
        };
      }

      case "md5sum": {
        if (!args[0]) {
          return { output: ["md5sum: file required"], isError: true };
        }
        const file = args[0];
        return {
          output: [
            `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6  ${file}`,
            "",
            "✅ File integrity verified using MD5 hash",
            "ℹ️  Use for authorized forensic analysis",
          ],
        };
      }

      case "metasploit": {
        return {
          output: [
            "       =[ Metasploit Framework v6.2.24 ]",
            "+ -- --=[ 2224 exploits - 1164 auxiliary - 402 post ]",
            "+ -- --=[ Ethical Penetration Testing Framework ]",
            "",
            "⚠️  AUTHORIZATION & ETHICS",
            "Metasploit is for authorized penetration testing ONLY.",
            "",
            "Legal Framework:",
            "  • Must have written authorization",
            "  • Scope must be documented",
            "  • Rules of engagement agreed upon",
            "  • Test only specified systems",
            "",
            "Best Practices:",
            "  • Document all findings",
            "  • Report vulnerabilities responsibly",
            "  • Maintain confidentiality",
            "  • Follow disclosure timeline",
            "",
            "msf6 > use exploit/windows/smb/ms17_010_eternalblue",
            "msf6 > set LHOST 192.168.1.100",
            "msf6 > set RHOST 192.168.1.50",
            "msf6 > exploit -j",
          ],
        };
      }

      case "report": {
        return {
          output: [
            "═══════════════════════════════════════════════════════════",
            "Security Assessment Report Generator",
            "═══════════════════════════════════════════════════════════",
            "",
            "Generate a professional security assessment report:",
            "  report --type pentest --client [name] --date [YYYY-MM-DD]",
            "",
            "Report Sections:",
            "  ✓ Executive Summary",
            "  ✓ Scope & Methodology",
            "  ✓ Findings & Severity",
            "  ✓ Recommendations",
            "  ✓ Remediation Timeline",
            "  ✓ Conclusion & Sign-off",
            "",
            "Templates available for:",
            "  • Web Application PT",
            "  • Network Infrastructure",
            "  • Social Engineering",
            "  • Code Review",
            "  • Cloud Security",
          ],
        };
      }

      case "auth-check": {
        return {
          output: [
            "═══════════════════════════════════════════════════════════",
            "Authorization Verification Checklist",
            "═══════════════════════════════════════════════════════════",
            "",
            "Before using any penetration testing tools, verify:",
            "",
            "✓ SCOPE DOCUMENT",
            "  [ ] Written authorization obtained",
            "  [ ] Client signature on agreement",
            "  [ ] Testing dates specified",
            "  [ ] IP ranges/systems defined",
            "",
            "✓ RULES OF ENGAGEMENT",
            "  [ ] Testing hours specified",
            "  [ ] Contact procedures documented",
            "  [ ] Escalation procedures defined",
            "  [ ] No-test systems identified",
            "",
            "✓ LEGAL COMPLIANCE",
            "  [ ] CFAA compliance verified",
            "  [ ] Local law compliance checked",
            "  [ ] NDA signed if required",
            "  [ ] Insurance coverage confirmed",
            "",
            "⚠️  Proceed only if ALL items are checked.",
          ],
        };
      }

      case "compliance": {
        return {
          output: [
            "═══════════════════════════════════════════════════════════",
            "Security Standards & Guidelines",
            "═══════════════════════════════════════════════════════════",
            "",
            "🛡️ FRAMEWORKS & STANDARDS:",
            "",
            "📋 OWASP (Open Web Application Security Project)",
            "  • OWASP Top 10 - Most critical web vulnerabilities",
            "  • OWASP Testing Guide - Comprehensive web testing",
            "  • OWASP Risk Rating Methodology",
            "",
            "📊 NIST (National Institute of Standards & Technology)",
            "  • NIST Cybersecurity Framework",
            "  • SP 800-53 - Security Controls",
            "  • SP 800-115 - Security Testing Guide",
            "",
            "🔍 CIS (Center for Internet Security)",
            "  • CIS Benchmarks - Best practices",
            "  • CIS Controls - Prioritized security actions",
            "",
            "⚖️ LEGAL FRAMEWORKS:",
            "  • Computer Fraud and Abuse Act (CFAA) - USA",
            "  • General Data Protection Regulation (GDPR) - EU",
            "  • Computer Misuse Act (CMA) - UK",
            "  • Responsible Disclosure Standards",
            "",
            "ℹ️  Reference these standards in your testing methodology.",
          ],
        };
      }

      case "legal-notice": {
        return {
          output: [
            "═══════════════════════════════════════════════════════════",
            "LEGAL DISCLAIMER",
            "═══════════════════════════════════════════════════════════",
            "",
            "⚠️  IMPORTANT NOTICE",
            "",
            "These penetration testing tools are for AUTHORIZED use only.",
            "",
            "Unauthorized Access is ILLEGAL:",
            "  • Computer Fraud and Abuse Act (CFAA) - Up to 10 years prison",
            "  • Identity theft laws - Civil & criminal penalties",
            "  • Wire fraud statutes - Up to 20 years prison",
            "  • GDPR violations - Up to €20 million in fines",
            "",
            "LEGAL USES ONLY:",
            "  ✓ Testing systems you own",
            "  ✓ Authorized penetration testing",
            "  ✓ Educational labs & training",
            "  ✓ Licensed security research",
            "",
            "BEFORE TESTING:",
            "  1. Obtain written authorization",
            "  2. Define scope clearly",
            "  3. Document rules of engagement",
            "  4. Maintain proper liability insurance",
            "  5. Follow responsible disclosure",
            "",
            "CONSEQUENCES OF MISUSE:",
            "  • Criminal prosecution",
            "  • Civil liability",
            "  • Data breach fines",
            "  • System access denial",
            "  • Professional license revocation",
            "",
            "USE THIS RESPONSIBLY AND LEGALLY.",
            "═══════════════════════════════════════════════════════════",
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
      
      if (currentInput.trim()) {
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
    }
  };

  return (
    <div 
      ref={terminalRef}
      className="h-full bg-black/95 p-4 font-mono text-sm overflow-auto cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <p className="text-green-400 font-bold">KaliGpt Security Terminal v1.0</p>
      <p className="text-red-400 mb-2">⚠️  Authorized Penetration Testing & Security Auditing</p>
      <p className="text-muted-foreground mb-3">Type 'help' for available commands | Type 'legal-notice' for disclaimer</p>
      
      {history.map((entry, i) => (
        <div key={i} className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400">admin@kali</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-muted-foreground">~</span>
            <span className="text-muted-foreground">$</span>
            <span className="text-foreground">{entry.command}</span>
          </div>
          {entry.output.map((line, j) => (
            <p key={j} className={entry.isError ? "text-red-400" : "text-foreground/80"}>
              {line}
            </p>
          ))}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <span className="text-green-400">admin@kali</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-muted-foreground">~</span>
        <span className="text-muted-foreground">$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-foreground caret-green-400"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};
