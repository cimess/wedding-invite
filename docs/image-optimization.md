# Smaller wedding images with ImageMagick

These commands create new files and leave the originals alone. Run them yourself from the project directory. This Linux environment has ImageMagick's `convert` command; on ImageMagick 7 use `magick` in its place.

## Start with visual quality

```bash
convert "public/images/wedding-pic/hero.jpg" \
  -auto-orient -colorspace sRGB -resize '1600x1600>' -strip \
  -quality 82 -define webp:method=6 \
  "public/images/wedding-pic/hero.webp"
```

This fits the image inside a 1600 × 1600 pixel box, preserves its proportions, and never enlarges it. It does not crop. `-auto-orient` respects camera orientation before metadata is stripped. `-strip` removes metadata, including EXIF. Quality 82 is an encoder setting, not a claim that 82% of the visible quality survives.

For a portrait that needs a 2000-pixel long edge, use `'2000x2000>'`; for a wide desktop reception image, start with `'1920x1920>'`. These may need more than 100 KB. Check faces, hair, fabric, flowers, and gradients at the size they will appear on screen.

## Aim around 100 KB

```bash
convert "public/images/wedding-pic/hero.jpg" \
  -auto-orient -colorspace sRGB -resize '1200x1200>' -strip \
  -quality 80 -define webp:method=6 \
  -define webp:target-size=100000 -define webp:pass=6 \
  "public/images/wedding-pic/hero-small.webp"

stat -c '%n: %s bytes' "public/images/wedding-pic/hero-small.webp"
```

`target-size` is a best-effort target, not a strict maximum. 100000 bytes = 100 decimal KB. If it is too large, try a 1000-pixel long edge or lower the quality to 75. If details look soft, increase the target size instead. Always re-encode from the original, not a previously compressed WebP.

## Convert a folder

Run this from a folder containing your source JPG/PNG photos. Outputs go into a new `webp` directory. Re-running replaces only those generated outputs.

```bash
mkdir -p webp
for image in *.jpg *.jpeg *.png *.JPG *.JPEG *.PNG; do
  [ -f "$image" ] || continue
  convert "$image" -auto-orient -colorspace sRGB \
    -resize '1600x1600>' -strip -quality 82 -define webp:method=6 \
    "webp/${image}.webp"
done
```

Run the loop in **bash** (enter `bash` first if your shell is zsh). The original extension is retained in the output name, e.g. `portrait.jpg.webp`, to avoid collisions between `portrait.jpg` and `portrait.png`.

## Connect the files to the page

Update `app/content/wedding-images.ts`:

```ts
hero: {
  src: "/images/wedding-pic/hero.webp",
  alt: "Describe the actual image here",
},
```

Use the same pattern for `reception` and for entries in `gallery`. Files in `public/` are served without `public` in the URL. Next.js generates responsive variants, and the gallery loads lazily. The full-image viewer displays the complete composition without cropping.

## What “100% quality” means

Lossless WebP can preserve decoded pixels, but cannot guarantee a 100 KB output for a large detailed photograph. Resizing also changes pixels. Lossy WebP often looks very close to the original at normal viewing sizes, with no universal size or quality guarantee. A slightly larger sharp desktop photo is preferable to forcing every image below 100 KB; responsive delivery is the better way to keep mobile downloads small.

References: https://imagemagick.org/webp/ and https://imagemagick.org/command-line-options/
