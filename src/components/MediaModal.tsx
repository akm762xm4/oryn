import { useState, useEffect } from "react";
import { LoadingSpinner, Modal } from "./ui";
import Button from "./ui/Button";
import api from "../lib/api";
import { socketService } from "../lib/socket";
import ImageViewer from "./ImageViewer";

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

interface MediaMessage {
  _id: string;
  imageUrl: string;
  createdAt: string;
  sender: {
    username: string;
  };
}

interface MediaResponse {
  media: MediaMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function MediaModal({
  isOpen,
  onClose,
  conversationId,
}: MediaModalProps) {
  const [mediaMessages, setMediaMessages] = useState<MediaMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Fetch media
  const fetchMedia = async (page = 1) => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await api.get<MediaResponse>(
        `/chat/conversations/${conversationId}/media?page=${page}&limit=20`
      );
      setMediaMessages(res.data.media);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh when modal opens
  useEffect(() => {
    if (isOpen) fetchMedia(1);
  }, [isOpen, conversationId]);

  // Live update on new images
  useEffect(() => {
    if (!isOpen) return;
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (
        msg.conversationId === conversationId &&
        msg.messageType === "image"
      ) {
        fetchMedia(pagination.page);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [isOpen, conversationId, pagination.page]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Media & Files (${pagination.total})`}
        size="xl"
        className="max-w-4xl max-h-[90vh]"
      >
        <div className="space-y-3">
          {/* Media grid */}
          <div className="overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            {loading ? (
              <div className="flex justify-center items-center py-8 text-muted-foreground">
                <LoadingSpinner size="lg" />
              </div>
            ) : mediaMessages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No media shared in this conversation yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 overflow-x-hidden overflow-y-auto md:grid-cols-3 lg:grid-cols-4 gap-2 md:min-h-[30vh] min-h-[20vh] md:max-h-[30vh] max-h-[45vh]">
                {mediaMessages.map((m) => (
                  <button
                    key={m._id}
                    onClick={() => setViewerUrl(m.imageUrl)}
                    className="md:w-32 w-28 md:h-32 h-28 bg-muted rounded-md overflow-hidden"
                  >
                    <img
                      src={m.imageUrl}
                      alt="media"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder-image.png";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMedia(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMedia(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Image Viewer */}
      <ImageViewer imageUrl={viewerUrl} onClose={() => setViewerUrl(null)} />
    </>
  );
}
