import { Zap, Github, Twitter, Linkedin, Mail, Heart, Code, Cloud, Smartphone, Globe } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Security", "Enterprise"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Documentation", "API", "Community", "Support"],
  Legal: ["Privacy", "Terms", "Cookies", "Licenses"],
};

const socialLinks = [
  { icon: Github, href: "#", label: "GitHub", color: "text-slate-400" },
  { icon: Twitter, href: "#", label: "Twitter", color: "text-sky-400" },
  { icon: Linkedin, href: "#", label: "LinkedIn", color: "text-blue-400" },
  { icon: Mail, href: "#", label: "Email", color: "text-red-400" },
];

const featureIcons = [
  { icon: Cloud, label: "Cloud" },
  { icon: Code, label: "Code" },
  { icon: Smartphone, label: "Mobile" },
  { icon: Globe, label: "Global" },
];

export const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-primary/30 bg-background/50 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Feature Icons Section */}
        <div className="mb-12">
          <h3 className="text-center font-semibold text-foreground mb-6" style={{ textShadow: "0 0 10px hsl(var(--primary) / 0.5)" }}>
            ✨ Platform Features
          </h3>
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {featureIcons.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <Icon className="w-6 h-6 text-primary" style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }} />
                  <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <Zap 
                className="w-6 h-6 text-primary"
                style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary)))" }}
              />
              <span 
                className="font-bold text-lg text-foreground"
                style={{ textShadow: "0 0 10px hsl(var(--primary))" }}
              >
                CLOUD<span className="text-primary">SPACE</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground mb-4">
              The future of cloud computing is here.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    title={social.label}
                    className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all hover:scale-110"
                  >
                    <Icon className={`w-5 h-5 ${social.color}`} style={{ filter: "drop-shadow(0 0 4px currentColor)" }} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 
                className="font-semibold text-foreground mb-4"
                style={{ textShadow: "0 0 5px hsl(var(--primary) / 0.5)" }}
              >
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-primary/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 CloudSpace. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-500" /> for the future
          </p>
        </div>
      </div>
    </footer>
  );
};
