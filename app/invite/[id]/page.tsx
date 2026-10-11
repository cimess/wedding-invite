import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getGuestByToken, getAllGuests } from "@/app/lib/guest";
import InvitationQR from "@/app/componet/invitation-qr";

export async function generateStaticParams() {
  const guests = getAllGuests();
  return guests.map((guest) => ({
    id: guest.token,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const guest = getGuestByToken(id);

  if (!guest) {
    return {
      title: "Wedding Invitation — Tobore & Ebunoluwa",
      description: "A celebration of love & togetherness. Saturday, 19 December 2026.",
    };
  }

  return {
    title: `Wedding Pass for ${guest.name} — Tobore & Ebunoluwa`,
    description: `Dear ${guest.name}, you are warmly invited to celebrate the wedding of Tobore & Ebunoluwa on Saturday, 19 December 2026.`,
    openGraph: {
      title: `Wedding Pass for ${guest.name} — Tobore & Ebunoluwa`,
      description: `Dear ${guest.name}, you are warmly invited to celebrate the wedding of Tobore & Ebunoluwa on Saturday, 19 December 2026.`,
      images: [
        {
          url: "/images/wedding-pic/hero.webp",
          width: 1200,
          height: 630,
          alt: `Wedding pass for ${guest.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Wedding Pass for ${guest.name} — Tobore & Ebunoluwa`,
      description: `Dear ${guest.name}, you are warmly invited to celebrate the wedding of Tobore & Ebunoluwa on Saturday, 19 December 2026.`,
      images: ["/images/wedding-pic/hero.webp"],
    },
  };
}

const wedding = {
  groomName: "Tobore",
  brideName: "Ebunoluwa",
  dateFormatted: "Saturday, 19 December 2026",
  time: "Reception follows immediately",
  venueTitle: "The NAFOWA Hall",
  venueSub: "Children's Park Multipurpose Hall, Sam Ethnan Air Force Base, Ikeja, Lagos",
  lat: 6.5925,
  lng: 3.3444,
};

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const guest = getGuestByToken(id);

  // Address for map queries
  const fullAddress = `${wedding.venueTitle}, ${wedding.venueSub}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(fullAddress)}`;

  // --------------------------------------------------
  // INVALID / UNKNOWN LINK
  // --------------------------------------------------
  if (!guest) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-4 py-16 text-center text-[#34372f] flex items-center justify-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-[#d9d0be] bg-white/90 p-8 md:p-12 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#91754c]">
            A Celebration of Love
          </p>

          <h1 className="mt-3 font-serif text-4xl font-normal text-[#2c2820]">
            Tobore <span className="text-[#91754c] italic">&amp;</span> Ebunoluwa
          </h1>

          <div className="mx-auto my-6 h-px w-16 bg-[#91754c]/40" />

          <p className="text-sm leading-relaxed text-[#736c5f]">
            This personal invitation link could not be verified. If you received this by message, please contact the couple or event host.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-full bg-[#34372f] px-6 py-3 text-xs font-semibold tracking-wider text-white transition hover:bg-[#91754c]"
            >
              Visit Wedding Home →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // VALID GUEST INVITATION
  // --------------------------------------------------
  const tableAssignment = guest.table || "Reserved Guest Area";

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-10 md:py-16 text-[#34372f] flex flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-2xl">
        {/* Navigation back to main site */}
        <div className="mb-6 flex justify-between items-center text-xs text-[#8a7e6b]">
          <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-[#91754c]">
            <span>←</span>
            <span>Back to Tobore &amp; Ebunoluwa</span>
          </Link>
          <span className="font-mono text-[10px] tracking-widest text-[#91754c]">19.12.26</span>
        </div>

        {/* LUXURY INVITATION CARD */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#d9d0be] bg-white p-8 md:p-14 shadow-xl">
          {/* Subtle gold inner border */}
          <div className="pointer-events-none absolute inset-3 rounded-[2rem] border border-[#91754c]/20" />

          {/* Monogram Seal */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#91754c]/40 bg-[#f7f4ee] shadow-sm">
            <span className="font-serif text-2xl italic text-[#91754c]">T&amp;E</span>
          </div>

          {/* Top greeting */}
          <div className="mt-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#91754c] font-semibold">
              You are warmly invited
            </p>
            <h1 className="mt-2 font-serif text-3xl md:text-5xl font-medium text-[#2c2820]">
              {guest.name}
            </h1>
            <p className="mt-2 font-serif text-lg italic text-[#8a7e6b]">
              to celebrate our beginning of forever
            </p>
          </div>

          <div className="mx-auto my-8 h-px w-24 bg-[#91754c]/30" />

          {/* COUPLE BANNER */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#8a7e6b]">
              The Wedding Celebration Of
            </p>
            <h2 className="mt-1 font-serif text-2xl md:text-3xl text-[#2c2820]">
              Tobore <em>&amp;</em> Ebunoluwa
            </h2>
          </div>

          {/* EVENT DETAILS GRID */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DATE & TIME */}
            <div className="rounded-2xl border border-[#ece6d8] bg-[#f7f4ee] p-5 text-center">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#91754c] font-semibold">
                DATE &amp; TIME
              </span>
              <p className="mt-2 font-serif text-xl font-medium text-[#2c2820]">
                {wedding.dateFormatted}
              </p>
              <p className="mt-1 text-xs text-[#736c5f]">
                {wedding.time}
              </p>
            </div>

            {/* SEATING ARRANGEMENT */}
            <div className="rounded-2xl border border-[#ece6d8] bg-[#f7f4ee] p-5 text-center">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#91754c] font-semibold">
                SEAT ARRANGEMENT
              </span>
              <p className="mt-2 font-serif text-xl font-medium text-[#91754c]">
                {tableAssignment}
              </p>
              <p className="mt-1 text-xs text-[#736c5f]">
                {guest.seat ? `Assigned Seat: ${guest.seat}` : "Open within reserved table"}
              </p>
            </div>
          </div>

          {/* PERSONAL ADMIT PASS & BARCODE / QR DOWNLOAD */}
          <div className="mt-8 rounded-3xl border border-[#ece6d8] bg-[#f7f4ee] p-6 sm:p-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#91754c] font-semibold">
              Official Guest Entry Pass
            </p>
            <h3 className="mt-1 font-serif text-2xl font-semibold text-[#2c2820]">
              Barcode &amp; Admission Card
            </h3>
            <p className="mt-1.5 text-xs text-[#736c5f] max-w-md mx-auto leading-relaxed">
              Generate and download your high-resolution split admission card with scannable barcode to keep on your phone or print for check-in.
            </p>

            <div className="mt-6">
              <InvitationQR
                isAdmin={false}
                token={guest.token}
                guestName={guest.name}
                table={guest.table}
                seat={guest.seat}
              />
            </div>
          </div>

          {/* VENUE & INBUILT MAP BUTTON */}
          <div className="mt-6 rounded-2xl border border-[#ece6d8] bg-[#f7f4ee] p-6 text-center">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#91754c] font-semibold">
              VENUE LOCATION
            </span>
            <h3 className="mt-2 font-serif text-2xl font-semibold text-[#2c2820]">
              {wedding.venueTitle}
            </h3>
            <p className="mt-1 text-xs md:text-sm text-[#736c5f] max-w-md mx-auto leading-relaxed">
              {wedding.venueSub}
            </p>

            {/* Inbuilt Map Action Buttons */}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#34372f] px-5 py-2.5 text-xs font-semibold tracking-wider text-white transition hover:bg-[#91754c] shadow-sm"
              >
                <span>📍 Open in Maps</span>
                <span aria-hidden="true">↗</span>
              </a>

              <a
                href={appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#91754c] bg-white px-5 py-2.5 text-xs font-semibold tracking-wider text-[#34372f] transition hover:bg-[#91754c]/10"
              >
                <span>Apple Maps (iOS)</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          {/* CHECK-IN NOTE */}
          <div className="mt-8 text-center text-xs text-[#8a7e6b] leading-relaxed">
            <p>
              Please keep your invitation pass or confirmation message handy upon arrival for swift check-in.
            </p>
            <p className="mt-1 font-serif italic text-sm text-[#91754c]">
              We look forward to celebrating this unforgettable day with you.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-[#8a7e6b]">
          Tobore &amp; Ebunoluwa · 19 December 2026 · Lagos, Nigeria
        </footer>
      </div>
    </main>
  );
}