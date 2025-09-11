import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define available backgrounds
export const backgroundOptions = [
  {
    id: "default",
    name: "Default",
    value: "bg-background",
    preview: "#ffffff",
    isImage: false,
    isTheme: false,
  },
  // {
  //   id: "bg1",
  //   name: "Background 1",
  //   value: "url('/bg-1.png')",
  //   preview: "url('/bg-1.png')",
  //   isImage: true,
  //   isTheme: false,
  // },
  // {
  //   id: "bg2",
  //   name: "Background 2",
  //   value: "url('/bg-2.png')",
  //   preview: "url('/bg-2.png')",
  //   isImage: true,
  //   isTheme: false,
  // },
  // {
  //   id: "bg3",
  //   name: "Background 3",
  //   value: "url('/bg-3.png')",
  //   preview: "url('/bg-3.png')",
  //   isImage: true,
  //   isTheme: false,
  // },
  // {
  //   id: "bg4",
  //   name: "Background 4",
  //   value: "url('/bg-4.png')",
  //   preview: "url('/bg-4.png')",
  //   isImage: true,
  //   isTheme: false,
  // },
  // {
  //   id: "bg5",
  //   name: "Background 5",
  //   value: "url('/bg-5.png')",
  //   preview: "url('/bg-5.png')",
  //   isImage: true,
  //   isTheme: false,
  // },
  // New color themes (non-image gradients)
  {
    id: "theme-sunset",
    name: "Sunset Glow",
    value: "",
    preview: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 50%, #fad0c4 100%)",
    isImage: false,
    isTheme: true,
    gradient:
      "radial-gradient(1200px 600px at -10% -10%, rgba(255,154,158,0.25) 0%, transparent 60%), radial-gradient(1000px 800px at 110% 10%, rgba(250,208,196,0.25) 0%, transparent 50%), linear-gradient(135deg, #ff9a9e 0%, #fecfef 40%, #fad0c4 100%)",
    bubble: {
      sentBg: "linear-gradient(135deg, #ff7a88 0%, #ff9a9e 100%)",
      sentText: "#ffffff",
      receivedBg: "linear-gradient(135deg, #fde2e4 0%, #fff1f2 100%)",
      receivedText: "#1f2937",
    },
  },
  {
    id: "theme-aurora",
    name: "Aurora",
    value: "",
    preview: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #cfd9ff 100%)",
    isImage: false,
    isTheme: true,
    gradient:
      "radial-gradient(800px 600px at 0% 0%, rgba(161,196,253,0.25) 0%, transparent 60%), radial-gradient(900px 700px at 100% 0%, rgba(194,233,251,0.25) 0%, transparent 55%), linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #cfd9ff 100%)",
    bubble: {
      sentBg: "linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)",
      sentText: "#ffffff",
      receivedBg: "linear-gradient(135deg, #ebf4ff 0%, #e0f2fe 100%)",
      receivedText: "#111827",
    },
  },
  {
    id: "theme-ocean",
    name: "Oceanic",
    value: "",
    preview: "linear-gradient(135deg, #2e3192 0%, #1bffff 100%)",
    isImage: false,
    isTheme: true,
    gradient:
      "radial-gradient(900px 700px at 10% 10%, rgba(46,49,146,0.25) 0%, transparent 60%), radial-gradient(900px 700px at 90% 0%, rgba(27,255,255,0.18) 0%, transparent 60%), linear-gradient(135deg, #2e3192 0%, #1bffff 100%)",
    bubble: {
      sentBg: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
      sentText: "#ffffff",
      receivedBg: "linear-gradient(135deg, #e0f2fe 0%, #ecfeff 100%)",
      receivedText: "#0f172a",
    },
  },
  {
    id: "theme-blossom",
    name: "Blossom",
    value: "",
    preview: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    isImage: false,
    isTheme: true,
    gradient:
      "radial-gradient(1000px 800px at 0% 100%, rgba(251,194,235,0.25) 0%, transparent 60%), radial-gradient(1000px 800px at 100% 100%, rgba(166,193,238,0.25) 0%, transparent 60%), linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    bubble: {
      sentBg: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
      sentText: "#ffffff",
      receivedBg: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)",
      receivedText: "#1f2937",
    },
  },
  {
    id: "theme-midnight",
    name: "Midnight",
    value: "",
    preview: "linear-gradient(135deg, #0f172a 0%, #1f2937 50%, #111827 100%)",
    isImage: false,
    isTheme: true,
    gradient:
      "radial-gradient(900px 700px at 0% 0%, rgba(14,165,233,0.08) 0%, transparent 60%), radial-gradient(900px 700px at 100% 0%, rgba(124,58,237,0.08) 0%, transparent 60%), linear-gradient(135deg, #0f172a 0%, #1f2937 50%, #111827 100%)",
    bubble: {
      sentBg: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      sentText: "#ffffff",
      receivedBg: "linear-gradient(135deg, #1f2937 0%, #0f172a 100%)",
      receivedText: "#e5e7eb",
    },
  },
];

interface BackgroundState {
  selectedBackground: string;
  setBackground: (backgroundId: string) => void;
  getCurrentBackground: () => (typeof backgroundOptions)[0];
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set, get) => ({
      selectedBackground: "default",

      setBackground: (backgroundId: string) => {
        set({ selectedBackground: backgroundId });
      },

      getCurrentBackground: () => {
        const { selectedBackground } = get();
        return (
          backgroundOptions.find((bg) => bg.id === selectedBackground) ||
          backgroundOptions[0]
        );
      },
    }),
    {
      name: "background-storage",
    }
  )
);
