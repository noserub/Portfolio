import { useState } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { ImageGallery } from "../components/ImageGallery";
import { Lightbox } from "../components/Lightbox";
import { useSEO } from "../hooks/useSEO";
import { useVisualsGallery } from "../hooks/useVisualsGallery";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

interface VisualsProps {
  onBack: () => void;
  isEditMode: boolean;
}

const defaultVisualImages: GalleryImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydHxlbnwxfHx8fDE3NTkzMTU2NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    alt: "Visual 1",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1554941829-202a0b2403b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHN0dWRpb3xlbnwxfHx8fDE3NTkzMTc4NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    alt: "Visual 2",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1705909773420-8d7af2a343f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc1OTI4MDg2M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    alt: "Visual 3",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1519662978799-2f05096d3636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzU5MzU4MjY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    alt: "Visual 4",
  },
];

export function Visuals({ onBack, isEditMode }: VisualsProps) {
  // Apply SEO for visuals page
  useSEO('visuals');
  
  // Supabase visuals gallery hook
  const { images, loading, createImage, updateImage, deleteImage } = useVisualsGallery();
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  return (
    <PageLayout title="Visuals" onBack={onBack}>
      <div className="space-y-8">
        <p className="text-muted-foreground max-w-2xl">
          A curated collection of visual work. From branding to digital design, each piece
          represents our commitment to excellence and attention to detail.
        </p>

        <ImageGallery
          images={images}
          onImagesChange={setImages}
          onImageClick={setLightboxImage}
          columns={4}
          isEditMode={isEditMode}
        />

        {lightboxImage && (
          <Lightbox
            isOpen={true}
            onClose={() => setLightboxImage(null)}
            imageUrl={lightboxImage.url}
            imageAlt={lightboxImage.alt}
          />
        )}
      </div>
    </PageLayout>
  );
}

export default Visuals;