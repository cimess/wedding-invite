/**
 * All landing-page photos live here. Put files in public/images/wedding-pic/
 * and use paths such as /images/wedding-pic/portrait.webp (omit "public").
 * Add/remove gallery entries freely; the layouts and reveals repeat automatically.
 * Unsplash images are temporary previews, not the actual couple or venue.
 */
export type WeddingPhoto = {
  src: string;
  alt: string;
  caption?: string;
  /** CSS object-position, e.g. "50% 30%", to adjust the preview crop. */
  position?: string;
};

export const weddingImages: {
  hero: WeddingPhoto;
  reception: WeddingPhoto;
  gallery: WeddingPhoto[];
} = {
  hero: {
    src: "/images/wedding-pic/hero.webp",
    alt: "Wedding flowers in warm evening light ",
  },
  reception: {
    src: "/images/wedding-pic/reception.webp",
    alt: "Floral wedding table setting ",
  },
  gallery: [
    {
      src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
      alt: "A couple holding wedding flowers in golden light — Unsplash preview",
      caption: "The little moments. The biggest love.",
      position: "55% 50%",
    },
    {
      src: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80",
      alt: "Flowers and glassware arranged on a wedding table — Unsplash preview",
      caption: "A place for everyone we love.",
    },
    {
      src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80",
      alt: "A romantic wedding moment — Unsplash preview",
      caption: "A little closer to forever.",
    },
    {
      src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80",
      alt: "An elegant celebration setting — Unsplash preview",
      caption: "And the best is still to come.",
    },
  ],
};
