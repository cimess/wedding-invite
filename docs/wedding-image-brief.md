# Wedding landing page image brief

The landing page currently uses two temporary Unsplash image URLs, configured in `app/content/wedding-images.ts`. They illustrate the mood, not the actual couple or venue.

## 1. Main couple portrait — required

- File: `public/images/couple-hero.webp`
- Size: **1600 × 2000 px (4:5 portrait)**.
- Composition: Couple centred with generous space above their heads for the arch crop. Keep faces and important details in the central 65%. Lower quarter can be darker; a script caption overlays it. No embedded text.
- Prompt: “Luxury editorial wedding portrait of Tobore and Ebunoluwa, using the supplied reference photographs to preserve their likeness. Ivory bridal styling and a tailored dark suit, intimate natural pose, soft golden-hour side light, warm champagne and olive undertones, subtle film grain, romantic understated background, authentic skin tones, premium magazine photography. Portrait 4:5 composition, generous headroom, both subjects in the central frame, no typography, no watermark.”
- Use reference photos of the real couple; avoid generating unrelated people as them. A real portrait also works beautifully.

## 2. Reception atmosphere — required

- File: `public/images/reception-atmosphere.webp`
- Size: **2400 × 1350 px (16:9 landscape)**.
- Composition: Wide reception tables, ivory florals, champagne details, gentle candlelight. A calm centre for large white text. Mobile crops to the centre. No embedded text or prominent faces.
- Prompt: “Cinematic luxury wedding reception atmosphere, ivory roses and delicate white florals, champagne gold table accents, fine linen, glassware and warm candlelight, muted olive foliage, refined romantic editorial photography, natural warm colours, subtle film grain. Wide 16:9 view, layered depth, uncluttered central area for a heading, no people in the foreground, no lettering, no watermark.”
- This is mood imagery. Use a real venue photograph if the image should depict the actual NAFOWA Hall.

## Matching treatment

Warm ivory (#f7f4ee), antique champagne gold (#91754c), and muted olive charcoal (#34372f). Keep both images cohesive in lighting, contrast, and colour temperature. Export high-quality WebP, ideally below 500 KB per image. Do not bake names or dates into imagery; the page supplies accessible animated text.

The gold rings are rendered live in Three.js and need no image asset. The botanical line art and invitation envelope are code-native and need no generated replacements.

## Gallery and image configuration

All landing-page paths (hero, reception, and gallery) are in `app/content/wedding-images.ts`. Add each image to the `gallery` array:

```ts
{
  src: "/images/wedding-pic/photo-01.webp",
  alt: "Tobore and Ebunoluwa walking hand in hand",
  caption: "A little closer to forever.",
  position: "50% 35%", // optional preview crop; full-image viewer never crops
},
```

Files go in `public/images/wedding-pic/`; public URLs omit `public`. Add or remove entries without changing the component. Four presentation styles cycle automatically. The gallery appears after RSVP, with a pinned scroll sequence on larger screens, individual reveals on mobile, and a static collection when motion is paused or reduced. Select an image to view it uncropped; Escape closes the viewer, and left/right arrow keys navigate. Zero images hide the gallery; one image stays a regular photo.

Next.js Image optimization is enabled with responsive sizes and lazy loading for gallery images. Only the hero loads with priority. Original images stay untouched.
