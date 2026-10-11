"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from "motion/react";

import PhotoGallery from "./photo-gallery";
import { weddingImages } from "@/app/content/wedding-images";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const Rings = dynamic(() => import("./rings"), { ssr: false });

const weddingDate = new Date("2026-12-19T00:00:00+01:00").getTime();
const venue = "The NAFOWA Hall, Children's Park Multipurpose Hall, Sam Ethnan Air Force Base, Lagos";

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Flower({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 180" fill="none" aria-hidden="true">
      <path d="M59 171C60 129 49 95 60 60M57 135C21 130 15 110 14 100C41 101 56 115 57 135ZM56 113C81 109 95 94 98 82C75 86 58 96 56 113Z" stroke="currentColor" strokeWidth="1.1" />
      {[0, 60, 120, 180, 240, 300].map((angle) => <ellipse key={angle} cx="60" cy="39" rx="13" ry="25" transform={`rotate(${angle} 60 60)`} stroke="currentColor" strokeWidth="1.1" />)}
      <circle cx="60" cy="60" r="8" stroke="currentColor" />
    </svg>
  );
}

function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, weddingDate - Date.now()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);
  const units = remaining === null ? [null, null, null, null] : [
    Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24,
    Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60,
  ];
  return (
    <div className="w-countdown" role="timer" aria-label="Countdown to 19 December 2026, Lagos time">
      {units.map((value, index) => <div key={index}><span>{value === null ? "—" : String(value).padStart(2, "0")}</span><small>{["Days", "Hours", "Minutes", "Seconds"][index]}</small></div>)}
    </div>
  );
}

export default function WeddingLanding() {
  const root = useRef<HTMLDivElement>(null);
  const ringsArea = useRef<HTMLDivElement>(null);
  const ringsVisible = useInView(ringsArea, { margin: "100px" });
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const animate = !paused && !reducedMotion;

  useGSAP(() => {
    if (paused) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro.from(".w-nav", { y: -18, opacity: 0, duration: 0.8 })
        .from(".w-hero-line > span", { yPercent: 115, rotate: 3, duration: 1.3, stagger: 0.15 }, "-=0.5")
        .from(".w-hero-photo", { clipPath: "inset(100% 0 0 0)", scale: 1.07, duration: 1.5 }, "-=1.3")
        .from(".w-hero-detail", { y: 20, opacity: 0, duration: 0.9, stagger: 0.12 }, "-=0.75");

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, { y: 45, opacity: 0, duration: 1, ease: "power2.out", scrollTrigger: { trigger: element, start: "top 90%", once: true } });
      });
      gsap.to(".w-hero-image", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".w-hero", start: "top top", end: "bottom top", scrub: 1 } });
      gsap.fromTo(".w-promise-word", { opacity: 0.25 }, { opacity: 1, stagger: 0.16, ease: "none", scrollTrigger: { trigger: ".w-promise", start: "top 75%", end: "bottom 60%", scrub: 0.6 } });
      gsap.fromTo(".w-celebration-image", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".w-celebration", start: "top bottom", end: "bottom top", scrub: 1 } });
      gsap.to(".w-orbit", { rotate: 360, duration: 65, repeat: -1, ease: "none" });
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [paused], revertOnUpdate: true });

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className={`wedding-page${paused ? " w-paused" : ""}`}>
        <a className="w-skip" href="#celebration">Skip to wedding details</a>
        <header className="w-nav">
          <Link href="/" className="w-monogram" aria-label="Tobore and Ebunoluwa home">T<span>&</span>E<i /></Link>
          <nav aria-label="Wedding navigation">
            <a href="#forever">Our forever</a>
            <a href="#celebration">The celebration</a>
            <a href="#gallery">Gallery</a>
            <a className="w-nav-rsvp" href="#rsvp">RSVP <Arrow /></a>
            <Link href="/scanner" className="w-nav-scanner" aria-label="Staff QR scanner">Scanner</Link>
          </nav>
        </header>

        <main id="main-content">
          <section className="w-hero" aria-labelledby="wedding-title">
            <div className="w-hero-copy">
              <p className="w-eyebrow w-hero-detail"><span className="w-short-rule" /> A celebration of love & togetherness</p>
              <h1 id="wedding-title"><span className="w-hero-line"><span>Tobore</span></span><span className="w-hero-line w-name-second"><span><em>&</em> Ebunoluwa</span></span></h1>
              <div className="w-hero-detail w-hero-note"><span className="w-tiny-star">✧</span><p>Of all the things we could be,<br />we choose <em>together.</em></p></div>
              <div className="w-hero-detail w-hero-actions">
                <motion.a className="w-button" href="#celebration" whileHover={animate ? { y: -3 } : {}} whileTap={animate ? { scale: 0.97 } : {}}>You&apos;re part of our forever <Arrow /></motion.a>
                <span className="w-hero-date">19 DECEMBER 2026<br /><small>LAGOS, NIGERIA</small></span>
              </div>
            </div>
            <div className="w-hero-visual">
              <div className="w-photo-outline" aria-hidden="true" />
              <div className="w-hero-photo">
                <Image src={weddingImages.hero.src} alt={weddingImages.hero.alt} style={{ objectPosition: weddingImages.hero.position }} fill sizes="(max-width: 700px) 90vw, 46vw" priority className="w-hero-image" />
                <div className="w-photo-shade" />
                <span className="w-photo-script">a lifetime of us.</span>
              </div>
              <div className="w-date-seal w-hero-detail"><span>DECEMBER</span><strong>19</strong><span>TWENTY TWENTY-SIX</span></div>
              <div className="w-rings w-hero-detail" ref={ringsArea} aria-hidden="true">{ringsVisible && <Rings animate={animate && ringsVisible} />}</div>
              <span className="w-side-label">THE BEGINNING OF ALWAYS</span>
              <Flower className="w-hero-flower" />
            </div>
            <div className="w-hero-bottom w-hero-detail"><a href="#forever"><span className="w-scroll-line" /> Scroll into our forever</a><span>WITH FULL HEARTS & OPEN ARMS</span><span>01 — 05</span></div>
          </section>

          <div className="w-ribbon" aria-hidden="true"><div>{Array.from({ length: 4 }, (_, i) => <span key={i}>a little magic <i>✧</i> a lifetime of love <i>✧</i> forever after <i>✧</i></span>)}</div></div>

          <section id="forever" className="w-forever w-section">
            <div className="w-section-label" data-reveal><span>01 / OUR FOREVER</span><Flower /></div>
            <div className="w-promise">
              <p className="w-eyebrow" data-reveal>TWO HEARTS. ONE BEAUTIFUL BEGINNING.</p>
              <h2>{"Some things are simply meant to be.".split(" ").map((word, index) => <span className={`w-promise-word${index > 3 ? " w-italic" : ""}`} key={index}>{word} </span>)}</h2>
              <div className="w-promise-bottom" data-reveal><p>We&apos;re stepping into forever, surrounded by the people who mean the world to us. A day for love, laughter, and memories we&apos;ll carry for a lifetime.</p><span className="w-signature">Tobore & Ebunoluwa</span></div>
            </div>
          </section>

          <section className="w-celebration" aria-label="A celebration to remember">
            <Image src={weddingImages.reception.src} alt={weddingImages.reception.alt} style={{ objectPosition: weddingImages.reception.position }} fill sizes="100vw" className="w-celebration-image" />
            <div className="w-celebration-shade" />
            <div className="w-celebration-copy" data-reveal><p className="w-eyebrow">OUR FAVOURITE PEOPLE. ONE UNFORGETTABLE DAY.</p><h2>Love brought us here.<br /><em>You make it a celebration.</em></h2></div>
            <span className="w-photo-caption">A GLIMPSE OF THE MOOD · PREVIEW IMAGERY</span>
          </section>

          <section id="celebration" className="w-details w-section">
            <div className="w-details-heading" data-reveal><p className="w-eyebrow">02 / THE CELEBRATION</p><h2>A date with <em>forever.</em></h2><p>Save a little space in your December for us.</p></div>
            <div className="w-event-layout">
              <div className="w-calendar-block" data-reveal><span className="w-eyebrow">SATURDAY</span><div className="w-big-date">19<span>12</span></div><p>December, 2026</p><a className="w-text-link" href="/tobore-ebunoluwa.ics" download>Add to your calendar <span aria-hidden="true">↓</span></a></div>
              <div className="w-event-info" data-reveal><span className="w-small-star" aria-hidden="true">✧</span><p className="w-eyebrow">THE WEDDING RECEPTION</p><h3>Let&apos;s make<br /><em>beautiful memories.</em></h3><address><strong>The NAFOWA Hall</strong><br />Children&apos;s Park Multipurpose Hall<br />Sam Ethnan Air Force Base, Lagos</address><p className="w-event-time">Please refer to your personal invitation for arrival details.</p><a className="w-text-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`} target="_blank" rel="noopener noreferrer">Find the venue <Arrow /></a></div>
            </div>
            <div className="w-countdown-row" data-reveal><div><p className="w-eyebrow">EVERY MOMENT BRINGS US CLOSER</p><h3>Until we say <em>“I do.”</em></h3></div><Countdown /></div>
          </section>

          <section id="rsvp" className="w-rsvp w-section">
            <div className="w-rsvp-copy" data-reveal><p className="w-eyebrow">03 / WITH LOVE, TO YOU</p><h2>It wouldn&apos;t be<br />the same <em>without you.</em></h2><p>Your presence is the most beautiful part of our day.<br />Let us know you&apos;ll be joining the celebration.</p><span className="w-signature">We saved you a little love.</span></div>
            <div className="w-invitation-wrap" data-reveal>
              <motion.div className="w-envelope" animate={{ rotate: invitationOpen || !animate ? 0 : -3 }} transition={{ duration: animate ? 0.5 : 0 }}>
                <div className="w-envelope-border" aria-hidden="true" />
                <Flower className="w-envelope-flower" />
                <p className="w-eyebrow">YOU&apos;RE WARMLY INVITED</p><h3>T <em>&</em> E</h3><p>To love, laughter & happily ever after.</p>
                <button type="button" className="w-wax-seal" aria-expanded={invitationOpen} aria-controls="rsvp-contacts" onClick={() => setInvitationOpen(!invitationOpen)}><span>{invitationOpen ? "−" : "T&E"}</span><small>{invitationOpen ? "CLOSE" : "OPEN"}</small></button>
              </motion.div>
              <AnimatePresence initial={false}>{invitationOpen && <motion.div id="rsvp-contacts" className="w-rsvp-contacts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: animate ? 0.35 : 0 }}><div><p className="w-eyebrow">KINDLY RSVP BY CALLING</p><a href="tel:+2348024716080"><span>Pelumi<small>0802 471 6080</small></span><Arrow /></a><a href="tel:+2348124211063"><span>Femi<small>0812 421 1063</small></span><Arrow /></a><p className="w-contact-note">Keep your personal invitation QR code handy for check-in.</p></div></motion.div>}</AnimatePresence>
              <p className="w-envelope-hint">{invitationOpen ? "We can’t wait to celebrate with you." : "A little invitation. Tap the seal to open."}</p>
            </div>
          </section>
          <PhotoGallery paused={paused} />
        </main>

        <footer id="wedding-end" className="w-footer"><div className="w-footer-top"><span className="w-eyebrow">05 / THE BEGINNING OF ALWAYS</span><a href="#wedding-title">Back to the beginning ↑</a></div><div className="w-footer-names">Tobore <em>&</em> Ebunoluwa<span className="w-orbit" aria-hidden="true">✳</span></div><div className="w-footer-bottom"><span>19.12.26 · LAGOS</span><span>MADE FOR A LIFETIME OF LOVE</span><Link href="/scanner" prefetch={false}>Staff check-in <Arrow /></Link></div></footer>
        <button className="w-motion-toggle" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}><span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>{paused ? "Play motion" : "Pause motion"}</button>
      </div>
    </MotionConfig>
  );
}
