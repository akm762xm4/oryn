import { useState } from "react";
import Button from "./ui/Button";
import { Modal } from "./ui";
import type { Message } from "../types";

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

export default function MediaModal({
  isOpen,
  onClose,
  messages,
}: MediaModalProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const imageMessages = messages.filter(
    (m) => m.messageType === "image" && m.imageUrl
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Media & Files"
        size="xl"
        className="max-w-4xl max-h-[85vh]"
      >
        <div className="overflow-auto max-h-[calc(85vh-120px)] grid grid-cols-2 md:grid-cols-3 gap-3">
          {imageMessages.map((m) => (
            <Button
              key={m._id}
              type="button"
              variant="ghost"
              size="md"
              className="group relative p-0"
              onClick={() => setViewerUrl(m.imageUrl!)}
              title="View image"
            >
              <img
                src={m.imageUrl!}
                alt="media"
                className="w-full h-40 object-cover rounded-lg"
              />
              <span className="absolute inset-0 rounded-lg ring-0 group-hover:ring-2 ring-primary/40 transition" />
            </Button>
          ))}

          {imageMessages.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-8">
              No media yet in this chat.
            </div>
          )}
        </div>
      </Modal>

      {/* Image Viewer */}
      {viewerUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewerUrl(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Close image viewer"
              onClick={() => setViewerUrl(null)}
            >
              ✕
            </Button>
            <img
              src={viewerUrl}
              alt="full"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
