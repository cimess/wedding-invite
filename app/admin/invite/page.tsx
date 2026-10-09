import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAllGuests } from "@/app/lib/guest";
import { isScannerAuthenticated } from "@/app/lib/scanner.auth";
import InvitationQR from "@/app/componet/invitation-qr";

async function InvitationContent() {
  const authenticated = await isScannerAuthenticated();

  if (!authenticated) {
    redirect("/");
  }

  const guests = getAllGuests();

  return (
    <div className="space-y-8">
      {guests.map((guest) => (
        <section
          key={guest.token}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{guest.name}</h2>
            <p className="mt-1 text-sm text-gray-500">Invitation QR</p>
          </div>

          <InvitationQR token={guest.token} guestName={guest.name} />
        </section>
      ))}
    </div>
  );
}

export default function InvitationGeneratorPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">

        <header className="mb-10 flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-semibold text-white">
            Wedding Invitations
          </h1>
          <p className="mt-2 text-gray-600">
            Generate and share a private invitation QR code for each guest.
          </p>
            </div>
            <a
              href="/"
              className="rounded-full bg-black px-5 py-3 text-sm text-white"
            >
              Home
            </a>
        </header>

        <Suspense fallback={
          <p className="text-white/60 text-sm">Loading guests...</p>
        }>
          <InvitationContent />
        </Suspense>

      </div>
    </main>
  );
}