import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Photo {
  id: number;
  photoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  uploadedAt: Date;
}

interface PhotoGalleryProps {
  leadId: number;
  photos: Photo[];
  onPhotoDeleted?: () => void;
  allowDelete?: boolean;
}

export default function PhotoGallery({ leadId, photos, onPhotoDeleted, allowDelete = true }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const deletePhotoMutation = trpc.photos.delete.useMutation({
    onSuccess: () => {
      toast.success("Photo deleted");
      onPhotoDeleted?.();
      setSelectedIndex(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete photo: ${error.message}`);
    },
  });

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setZoom(1);
    }
  };

  const handleDelete = () => {
    if (selectedIndex !== null) {
      const photo = photos[selectedIndex];
      if (confirm("Are you sure you want to delete this photo?")) {
        deletePhotoMutation.mutate({ id: photo.id });
      }
    }
  };

  const handleDownload = () => {
    if (selectedIndex !== null) {
      const photo = photos[selectedIndex];
      window.open(photo.photoUrl, "_blank");
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.5, 0.5));
  };

  if (photos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No photos uploaded yet</p>
      </Card>
    );
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors group"
          >
            <img
              src={photo.thumbnailUrl || photo.photoUrl}
              alt={photo.caption || `Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                {photo.caption}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          {selectedIndex !== null && (
            <div className="relative w-full h-full flex flex-col bg-black">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
                <div className="text-white">
                  <p className="font-semibold">
                    Photo {selectedIndex + 1} of {photos.length}
                  </p>
                  {photos[selectedIndex].caption && (
                    <p className="text-sm text-gray-300">{photos[selectedIndex].caption}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                  {allowDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      disabled={deletePhotoMutation.isPending}
                      className="text-white hover:bg-red-500/20"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedIndex(null)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Image */}
              <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
                <img
                  src={photos[selectedIndex].photoUrl}
                  alt={photos[selectedIndex].caption || `Photo ${selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>

              {/* Navigation */}
              {photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={selectedIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={selectedIndex === photos.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* Footer with thumbnails */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        setSelectedIndex(index);
                        setZoom(1);
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                        index === selectedIndex ? "border-primary" : "border-white/30"
                      }`}
                    >
                      <img
                        src={photo.thumbnailUrl || photo.photoUrl}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
