import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadProps {
  onPhotosChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
}

export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

export default function PhotoUpload({ onPhotosChange, maxPhotos = 10 }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const newPhotos: PhotoFile[] = files.map(file => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return null;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return null;
      }

      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        caption: "",
      };
    }).filter((p): p is PhotoFile => p !== null);

    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const removePhoto = (id: string) => {
    const photoToRemove = photos.find(p => p.id === id);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    const updatedPhotos = photos.filter(p => p.id !== id);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const updateCaption = (id: string, caption: string) => {
    const updatedPhotos = photos.map(p =>
      p.id === id ? { ...p, caption } : p
    );
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {/* Camera capture button (mobile) */}
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1"
        >
          <Camera className="mr-2 h-4 w-4" />
          Take Photo
        </Button>

        {/* File upload button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose Files
        </Button>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
      </div>

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {photos.map(photo => (
            <Card key={photo.id} className="p-2 relative">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 z-10"
                onClick={() => removePhoto(photo.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="aspect-square bg-muted rounded-md overflow-hidden mb-2">
                <img
                  src={photo.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <Label htmlFor={`caption-${photo.id}`} className="text-xs">
                  Caption (optional)
                </Label>
                <Input
                  id={`caption-${photo.id}`}
                  value={photo.caption}
                  onChange={(e) => updateCaption(photo.id, e.target.value)}
                  placeholder="Describe damage..."
                  className="text-xs h-8"
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No photos added yet. Take photos or upload from gallery.
          </p>
        </Card>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {photos.length} / {maxPhotos} photos added
        </p>
      )}
    </div>
  );
}
