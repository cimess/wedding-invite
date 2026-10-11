"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { weddingImages } from "@/app/content/wedding-images";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const photos = weddingImages.gallery;

// Elegant, hardware-accelerated transitions
const reveals = [
  { clipPath: "inset(100% 0% 0% 0%)", y: 25, rotation: 0, scale: 1 },
  { clipPath: "inset(0% 0% 0% 0%)", xPercent: 60, rotation: 6, scale: 0.9 },
  { clipPath: "inset(0% 0% 0% 0%)", yPercent: 40, rotation: -6, scale: 0.88 },
  { clipPath: "inset(0% 50% 0% 50%)", rotation: 0, scale: 1.08 },
];

export default function PhotoGallery({ paused }: { paused: boolean }) {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const viewerOpen = selected !== null;

  useGSAP(() => {
    if (paused || photos.length === 0) return;
    const mm = gsap.matchMedia();
    mm.add({
      reduce: "(prefers-reduced-motion: reduce)",
      all: "(min-width: 0px)",
    }, (context) => {
      if (context.conditions?.reduce) return;
      const cards = gsap.utils.toArray<HTMLElement>(".w-gallery-card", root.current);
      if (cards.length < 2) return;

      setPinned(true);
      setActive(0);
      gsap.set(cards, { position: "absolute", inset: 0, margin: "auto", autoAlpha: 0 });
      gsap.set(cards[0], { autoAlpha: 1 });

      // Snappy and crisp scroll distance:
      // ~0.85x - 0.9x viewport height per card so the user doesn't have to scroll for too long
      const isMobile = window.innerWidth <= 800;
      const scrollDistancePerCard = isMobile ? window.innerHeight * 0.85 : window.innerHeight * 0.9;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".w-gallery-pin",
          start: "top top",
          pin: true,
          anticipatePin: 1,
          end: () => `+=${scrollDistancePerCard * (cards.length - 1)}`,
          scrub: 0.55, // Snappy response to touch and wheel
          invalidateOnRefresh: true,
        },
        onUpdate: function () {
          setActive(Math.min(cards.length - 1, Math.floor(this.time() + 0.5)));
        },
      });

      cards.slice(1).forEach((card, index) => {
        const at = index + 0.5;
        // Fade outgoing card smoothly
        timeline.to(cards[index], {
          autoAlpha: 0,
          scale: 0.94,
          y: -20,
          duration: 0.45,
          ease: "power1.inOut",
        }, at);

        // Reveal incoming card with unique choreographed entrance
        timeline.fromTo(
          card,
          { ...reveals[(index + 1) % reveals.length], autoAlpha: 0 },
          {
            xPercent: 0,
            yPercent: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            autoAlpha: 1,
            duration: 0.65,
            ease: "power2.out",
          },
          at
        );
      });

      timeline.to({}, { duration: 0.3 });

      gsap.fromTo(
        ".w-gallery-progress > span",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".w-gallery-pin",
            start: "top top",
            end: () => `+=${scrollDistancePerCard * (cards.length - 1)}`,
            scrub: true,
          },
        }
      );

      return () => setPinned(false);
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [paused], revertOnUpdate: true });

  useEffect(() => {
    if (!viewerOpen) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    modal?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      modal?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [viewerOpen]);

  function step(direction: number) {
    setSelected((index) => index === null ? null : (index + direction + photos.length) % photos.length);
  }

  if (photos.length === 0) return null;
  const current = selected === null ? null : photos[selected];

  return (
    <section id="gallery" ref={root} className={`w-gallery${pinned ? " w-gallery-pinned" : ""}`} aria-labelledby="gallery-title">
      <div className="w-gallery-pin">
        <header className="w-gallery-heading">
          <div>
            <p className="w-eyebrow">04 / MOMENTS TO KEEP</p>
            <h2 id="gallery-title">A thousand little <em>forevers.</em></h2>
          </div>
          <div className="w-gallery-instructions">
            <p>{pinned ? "Scroll slowly. Stay a little." : "A few frames. A whole lot of love."}</p>
            <span>TAP A PHOTO TO SEE THE FULL PICTURE ↗</span>
          </div>
        </header>

        <div className="w-gallery-stage">
          {photos.map((photo, index) => (
            <figure
              className={`w-gallery-card w-gallery-style-${index % 4}`}
              key={`${photo.src}-${index}`}
              inert={pinned && index !== active}
              aria-hidden={pinned && index !== active ? true : undefined}
            >
              <button
                type="button"
                className="w-gallery-photo"
                onClick={() => setSelected(index)}
                aria-label={`View full image: ${photo.alt}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 85vw, 65vw"
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                  style={{ objectPosition: photo.position }}
                />
                <span className="w-gallery-expand" aria-hidden="true">FULL VIEW ↗</span>
              </button>
              <figcaption>
                <span>{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span>
                <p>{photo.caption ?? "A moment to remember."}</p>
                <span aria-hidden="true">✧</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="w-gallery-bottom">
          <span>OUR LITTLE COLLECTION OF LOVE</span>
          <div className="w-gallery-progress" aria-hidden="true">
            <span />
          </div>
          <a href="#wedding-end">Continue to the end ↓</a>
        </div>
      </div>

      <dialog
        ref={dialog}
        className="w-lightbox"
        aria-label="Wedding photo viewer"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
      >
        {current && (
          <div className="w-lightbox-content">
            <div className="w-lightbox-toolbar">
              <span>{(selected ?? 0) + 1} / {photos.length}</span>
              <button type="button" onClick={() => setSelected(null)} autoFocus aria-label="Close photo viewer">
                Close ×
              </button>
            </div>
            <div className="w-lightbox-photo">
              <Image
                key={current.src}
                src={current.src}
                alt={current.alt}
                fill
                sizes="95vw"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="w-lightbox-controls">
              <button type="button" onClick={() => step(-1)} disabled={photos.length < 2} aria-label="Previous photo">
                ←
              </button>
              <p aria-live="polite">{current.caption ?? current.alt}</p>
              <button type="button" onClick={() => step(1)} disabled={photos.length < 2} aria-label="Next photo">
                →
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
