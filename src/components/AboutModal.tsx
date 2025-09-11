import { Modal, Avatar } from "./ui";
import { ExternalLink } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const hrefs = {
    readme: "https://github.com/akm762xm4/oryn/blob/master/README.md",
    repo: "https://github.com/akm762xm4/oryn",
    vercel: "https://vercel.com/akm762xm4s-projects/oryn-frontend",
    render: "https://dashboard.render.com/project/prj-d2sphjje5dus73evqu0g",
    license: "https://github.com/akm762xm4/oryn/blob/master/LICENSE",
  };
  const links = [
    {
      id: "readme",
      title: "README",
      url: hrefs.readme,
      icon: "🐙",
      subtitle: "Project README on GitHub",
    },
    {
      id: "repo",
      title: "Repository",
      url: hrefs.repo,
      icon: "📦",
      subtitle: "Source code on GitHub",
    },
    {
      id: "vercel",
      title: "Vercel",
      url: hrefs.vercel,
      icon: "V",
      subtitle: "Live Frontend",
    },
    {
      id: "render",
      title: "Render",
      url: hrefs.render,
      icon: "R",
      subtitle: "Live Backend",
    },
    {
      id: "license",
      title: "License",
      url: hrefs.license,
      icon: "📄",
      subtitle: "Project license",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About Oryn" size="lg">
      <div className="space-y-4">
        {/* Header with logo */}
        <div className="flex items-center space-x-4">
          <Avatar src="/oryn.png" name="Oryn" size="lg" />
          <div>
            <h3 className="text-lg font-semibold">Oryn</h3>
            <p className="text-sm text-muted-foreground">
              A lightweight chat app — frontend + backend example project.
            </p>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map((l) => (
            <div
              key={l.id}
              className="relative flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center text-xl">
                  <span aria-hidden>{l.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{l.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l.subtitle}
                  </div>
                </div>
              </div>

              <div className="absolute right-0 top-0 flex items-center space-x-2">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2"
                  title={`Open ${l.title}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-border text-muted-foreground text-sm">
          <p>
            Oryn is an example MERN chat app showcasing real-time messaging,
            file uploads, OTP verification, and a clean UI built with React +
            Zustand.
          </p>
        </div>
      </div>
    </Modal>
  );
}
