import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllGuests } from "@/app/lib/guest";
import { isScannerAuthenticated } from "@/app/lib/scanner.auth";
import InvitationQR from "@/app/componet/invitation-qr";

async function InvitationContent() {
  const authenticated = await isScannerAuthenticated();

  if (!authenticated) {
    redirect("/scanner");
  }

  const guests = getAllGuests();

  return (
    <div className="space-y-6">
      {guests.map((guest) => (
        <section
          key={guest.token}
          className="rounded-3xl border border-[#d9d0be] bg-white/90 p-6 md:p-8 shadow-sm backdrop-blur-sm"
        >
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ece6d8] pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#91754c] font-semibold">
                Guest of Honour
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#2c2820]">
                {guest.name}
              </h2>
            </div>
            <div className="rounded-full bg-[#f7f4ee] px-3.5 py-1 text-xs text-[#736c5f] border border-[#e2d8c3]">
              Table: <strong className="text-[#34372f]">{guest.table || "Reserved Guest Area"}</strong>
            </div>
          </div>

          <InvitationQR
            token={guest.token}
            guestName={guest.name}
            table={guest.table}
            seat={guest.seat}
          />
        </section>
      ))}
    </div>
  );
}

export default function InvitationGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-12 text-[#34372f]">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#d9d0be] pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#91754c] font-semibold">
              Administration & Guest Passes
            </p>
            <h1 className="mt-1 font-serif text-3xl md:text-4xl font-normal text-[#2c2820]">
              Tobore <em>&amp;</em> Ebunoluwa
            </h1>
            <p className="mt-2 text-sm text-[#736c5f]">
              Generate, download split card passes, and share personalized QR codes for every guest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#d9d0be] bg-white px-5 py-2.5 text-xs font-semibold tracking-wider text-[#34372f] transition hover:bg-[#ece6d8]"
            >
              ← Main Site
            </Link>
            <Link
              href="/scanner"
              className="rounded-full bg-[#34372f] px-5 py-2.5 text-xs font-semibold tracking-wider text-white transition hover:bg-[#91754c]"
            >
              Open Scanner ↗
            </Link>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="py-20 text-center">
              <p className="font-serif text-lg italic text-[#91754c]">
                Loading guests collection...
              </p>
            </div>
          }
        >
          <InvitationContent />
        </Suspense>

        <footer className="mt-16 text-center text-xs text-[#9c9382]">
          Tobore &amp; Ebunoluwa · 19 December 2026 · Lagos
        </footer>
      </div>
    </main>
  );
}
