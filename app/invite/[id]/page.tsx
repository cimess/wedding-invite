import Image from "next/image";
import { getGuestByToken } from "@/app/lib/guest";

export const instant = false;

const wedding = {
  groomName: "Tobore",
  brideName: "Ebunoluwa",
  receptionImage: "/images/reception.png",
};

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Look up the guest on the server.
  const guest = getGuestByToken(id);

  // --------------------------------------------------
  // INVALID / UNKNOWN LINK
  // --------------------------------------------------

  if (!guest) {
    return (
      <main
        className="
          min-h-screen
          bg-[var(--background)]
          px-4
          py-12
          text-center
          text-[var(--fg)]
          [--bg1:#f4fafc]
          [--bg2:#dcecf3]
          [--fg:#1d3a4a]
          [--gold:#b8860b]
          sm:px-6
        "
      >
        <div className="mx-auto max-w-[700px]">
          <p className="text-[0.75rem] uppercase tracking-[0.3em] opacity-60">
            A special celebration
          </p>

          <h1
            className="
              mt-4
              font-[family-name:var(--font-great-vibes)]
              text-[clamp(3rem,11vw,5rem)]
              font-normal
              leading-tight
              text-[var(--gold)]
            "
          >
            {wedding.groomName}

            <span className="px-2 text-[0.75em] opacity-80">
              &amp;
            </span>

            {wedding.brideName}
          </h1>

          <div className="mx-auto my-6 h-px w-16 bg-[var(--gold)] opacity-60" />

          <p className="mx-auto max-w-md text-lg leading-8 opacity-75">
            We are delighted to share this special moment with you.
            Thank you for stopping by, and we hope you enjoy the celebration.
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // VALID GUEST
  // --------------------------------------------------

  return (
    <main
      className="
        min-h-screen
       bg-[var(--background)]
        px-4
        py-8
        text-center
        text-[var(--fg)]
        [--bg1:#f4fafc]
        [--bg2:#dcecf3]
        [--fg:#1d3a4a]
        [--gold:#b8860b]
        sm:px-6
      "
    >
      <div className="mx-auto max-w-[700px]">
        {/* GUEST NAME */}

        <section className="mb-7">
          <p className="text-[0.75rem] uppercase tracking-[0.3em] opacity-60">
            You are specially invited
          </p>

          <h1
            className="
              mt-3
              font-[family-name:var(--font-great-vibes)]
              text-[clamp(2.8rem,10vw,4.5rem)]
              font-normal
              leading-tight
              text-[var(--gold)]
            "
          >
            {guest.name}
          </h1>

          <div className="mx-auto mt-4 h-px w-16 bg-[var(--gold)] opacity-60" />

          <p className="mt-5 text-sm uppercase tracking-[0.25em] opacity-70">
          {guest.name}
          </p>
        </section>

        {/* RECEPTION INVITATION */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            drop-shadow-[0_12px_30px_rgba(0,0,0,0.2)]
          "
        >
          <Image
            src={wedding.receptionImage}
            alt={`Wedding invitation for ${guest.name}`}
            width={1200}
            height={1600}
            priority
            className="block h-auto w-full"
          />
        </div>
      </div>
    </main>
  );
}