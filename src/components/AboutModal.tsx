import { useNavigate } from "react-router-dom";
import { Modal, Avatar } from "./ui";
import { ExternalLink, Sparkles } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const navigate = useNavigate();

  const hrefs = {
    readme:  "https://github.com/akm762xm4/oryn/blob/master/README.md",
    repo:    "https://github.com/akm762xm4/oryn",
    vercel:  "https://vercel.com/akm762xm4s-projects/oryn-frontend",
    render:  "https://dashboard.render.com/project/prj-d2sphjje5dus73evqu0g",
    license: "https://github.com/akm762xm4/oryn/blob/master/LICENSE",
  };

  const links = [
    { id: "readme",  title: "README",     url: hrefs.readme,   icon: "📖", subtitle: "Project README on GitHub" },
    { id: "repo",    title: "Repository", url: hrefs.repo,     icon: "📦", subtitle: "Source code on GitHub" },
    { id: "vercel",  title: "Vercel",     url: hrefs.vercel,   icon: "▲",  subtitle: "Live Frontend" },
    { id: "render",  title: "Render",     url: hrefs.render,   icon: "R",  subtitle: "Live Backend" },
    { id: "license", title: "License",    url: hrefs.license,  icon: "📄", subtitle: "Project license" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About Oryn" size="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar src="/oryn-icon.svg" name="Oryn" size="md" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Oryn</h3>
            <p className="text-xs text-muted-foreground">
              Full-stack MERN chat app — real-time messaging + AI assistant.
            </p>
          </div>
        </div>

        {/* Showcase CTA */}
        <button
          onClick={() => { onClose(); navigate("/showcase"); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">App Showcase</p>
              <p className="text-xs text-muted-foreground">Features, tech stack &amp; live demo</p>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        {/* Links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-medium flex-shrink-0">
                {l.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground truncate">{l.subtitle}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-3 leading-relaxed">
          Oryn showcases real-time messaging, file uploads, OTP auth, AI integration, and a
          consistent Baroworks-themed UI built with React + Zustand.
        </p>
      </div>
    </Modal>
  );
}
