"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser";

import { useRouter } from "next/navigation";
import { connection } from "next/server";

type Guest = {
  name: string;
};

type ScanResult = {
  invited: boolean;
  guest?: Guest;
};

type SearchResponse = {
  invited: boolean;
  guests: Guest[];
  error?: string;
};

type ScannerState =
  | "checking"
  | "locked"
  | "ready"
  | "scanning"
  | "success"
  | "not-found"
  | "error";

export default function HomePage() {

   const router = useRouter();
  const [scannerState, setScannerState] =
    useState<ScannerState>("checking");

  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [searchError, setSearchError] = useState("");

  const [result, setResult] = useState<ScanResult | null>(null);

  const [scannerError, setScannerError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  /*
   * -------------------------------------------------------
   * Check whether this browser already has a valid session.
   * -------------------------------------------------------
   *
   * We intentionally don't store the authentication state
   * in localStorage.
   *
   * The HttpOnly cookie is automatically sent to the API.
   *
   * We simply test the protected guest route.
   */
  const checkAuthentication = useCallback(async () => {
    try {
   const response = await fetch("/api/scanner/session", {
  method: "GET",
  credentials: "include",
  cache: "no-store",
});

const data = await response.json();

      if (data.authenticated) {
        setScannerState("ready");
      } else {
        setScannerState("locked");
      }
    } catch {
      setScannerState("locked");
    }
  }, []);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  /*
   * -------------------------------------------------------
   * Login
   * -------------------------------------------------------
   */
  async function handleAuthentication(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!pin.trim()) {
      setPinError("Enter the scanner PIN.");
      return;
    }

    setPinLoading(true);
    setPinError("");

    try {
      const response = await fetch("/api/scanner/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          pin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPinError(data.error ?? "Invalid PIN.");
        return;
      }

      setPin("");
      setScannerState("ready");
    } catch {
      setPinError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setPinLoading(false);
    }
  }

  /*
   * -------------------------------------------------------
   * Guest lookup by QR token
   * -------------------------------------------------------
   */
  const verifyGuest = useCallback(async (token: string) => {
    if (!token.trim()) {
      return;
    }

    setScannerError("");
    setSearchError("");
    setResult(null);
    setScannerState("scanning");

    try {
      const response = await fetch(
        `/api/scanner/guest?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        setScannerState("locked");
        return;
      }

      const data: ScanResult = await response.json();

      if (!response.ok) {
        setScannerError(
          data?.guest
            ? ""
            : "Unable to verify this invitation."
        );
        setScannerState("error");
        return;
      }

      if (!data.invited) {
        setResult({
          invited: false,
        });

        setScannerState("not-found");
        return;
      }

      setResult(data);
      setScannerState("success");
    } catch {
      setScannerError(
        "Could not reach the server. Check your connection."
      );
      setScannerState("error");
    }
  }, []);

  /*
   * -------------------------------------------------------
   * Search guest by name
   * -------------------------------------------------------
   */
  async function handleGuestSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      setSearchError("Enter a guest name.");
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    setResult(null);

    try {
      const response = await fetch(
        `/api/scanner/guest?name=${encodeURIComponent(query)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        setScannerState("locked");
        return;
      }

      const data: SearchResponse = await response.json();

      if (!response.ok) {
        setSearchError(
          data.error ?? "Unable to search guests."
        );
        return;
      }

      setSearchResults(data.guests ?? []);

      if (!data.guests?.length) {
        setResult({
          invited: false,
        });

        setScannerState("not-found");
      }
    } catch {
      setSearchError(
        "Could not reach the server. Check your connection."
      );
    } finally {
      setSearchLoading(false);
    }
  }

  /*
   * -------------------------------------------------------
   * Select a guest from name search
   * -------------------------------------------------------
   */
  function selectGuest(guest: Guest) {
    setResult({
      invited: true,
      guest,
    });

    setSearchResults([]);
    setSearch("");
    setScannerState("success");
  }

  /*
   * -------------------------------------------------------
   * Start camera scanner
   * -------------------------------------------------------
   */
  async function startScanner() {
    setScannerError("");
    setResult(null);
    setScannerState("scanning");

    try {
      if (!videoRef.current) {
        throw new Error("Scanner video element is unavailable.");
      }

      controlsRef.current?.stop();

      const reader = new BrowserMultiFormatReader();

      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        },
        videoRef.current,
        (scanResult) => {
          if (!scanResult) {
            return;
          }

          const text = scanResult.getText();

          if (!text) {
            return;
          }

          /*
           * The QR may contain the full invitation URL:
           *
           * https://example.com/invite/random-token
           *
           * or potentially just the token.
           */
          const token = extractInvitationToken(text);

          if (!token) {
            setScannerError(
              "This QR code is not a valid wedding invitation."
            );
            return;
          }

          controlsRef.current?.stop();
          controlsRef.current = null;

          verifyGuest(token);
        }
      );

      controlsRef.current = controls;
    } catch (error) {
      console.error(error);

      setScannerError(
        "Camera access failed. Allow camera permission or use guest name search."
      );

      setScannerState("error");
    }
  }

  /*
   * -------------------------------------------------------
   * Stop scanner
   * -------------------------------------------------------
   */
  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }

  /*
   * -------------------------------------------------------
   * Reset current result
   * -------------------------------------------------------
   */
  function resetScanner() {
    stopScanner();

    setResult(null);
    setSearch("");
    setSearchResults([]);
    setSearchError("");
    setScannerError("");
    setScannerState("ready");
  }

  /*
   * -------------------------------------------------------
   * Logout
   * -------------------------------------------------------
   */
  async function handleLogout() {
    stopScanner();

    try {
      await fetch("/api/scanner/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setResult(null);
      setSearch("");
      setSearchResults([]);
      setScannerState("locked");
    }
  }

  /*
   * Clean camera when component unmounts.
   */
  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  /*
   * -------------------------------------------------------
   * Loading authentication check
   * -------------------------------------------------------
   */
  if (scannerState === "checking") {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#b8860b]/20 border-t-[#b8860b]" />

          <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#1d3a4a]">
            Preparing wedding check-in...
          </p>
        </div>
      </main>
    );
  }

  /*
   * -------------------------------------------------------
   * Locked / PIN screen
   * -------------------------------------------------------
   */
  if (scannerState === "locked") {
    return (
      <main className="min-h-screen bg-[var(--background)] px-5 py-10 text-[#1d3a4a]">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
          <section className="w-full rounded-[2rem] border border-white/70 bg-white/75 p-7 text-center shadow-[0_20px_70px_rgba(29,58,74,0.14)] backdrop-blur-xl sm:p-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#b8860b]/10">
              <span className="text-4xl">💍</span>
            </div>

            <p className="mb-2 text-[0.75rem] uppercase tracking-[0.3em] opacity-70">
              Wedding Check-In
            </p>

            <h1 className="font-[family-name:var(--font-great-vibes)] text-5xl text-[#b8860b]">
              Welcome
            </h1>

            <p className="mx-auto mt-4 max-w-sm font-[family-name:var(--font-cormorant)] text-lg leading-relaxed text-[#1d3a4a]/75">
              Enter the staff PIN to access the wedding
              invitation scanner.
            </p>

            <form
              onSubmit={handleAuthentication}
              className="mt-8 space-y-4"
            >
              <div className="text-left">
                <label
                  htmlFor="scanner-pin"
                  className="mb-2 block text-sm font-semibold text-[#1d3a4a]"
                >
                  Staff PIN
                </label>

                <input
                  id="scanner-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  onChange={(event) =>
                    setPin(event.target.value)
                  }
                  placeholder="Enter PIN"
                  className="h-14 w-full rounded-2xl border border-[#1d3a4a]/10 bg-white px-5 text-center text-lg tracking-[0.3em] outline-none transition focus:border-[#b8860b]/60 focus:ring-4 focus:ring-[#b8860b]/10"
                />
              </div>

              {pinError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                disabled={pinLoading}
                className="h-14 w-full rounded-2xl bg-[#1d3a4a] px-6 font-semibold text-white shadow-lg transition hover:bg-[#152d3a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pinLoading
                  ? "Checking..."
                  : "Open Scanner"}
              </button>
            </form>

            <p className="mt-7 text-xs text-[#1d3a4a]/50">
              Authorized wedding staff only
            </p>
          </section>
        </div>
      </main>
    );
  }

  /*
   * -------------------------------------------------------
   * Main scanner dashboard
   * -------------------------------------------------------
   */
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[#1d3a4a] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-7 flex items-center justify-between">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] opacity-60">
              Wedding Check-In
            </p>

            <h1 className="mt-1 font-[family-name:var(--font-great-vibes)] text-4xl text-[#b8860b] sm:text-5xl">
              Tobore & Ebunoluwa
            </h1>
          </div>
<div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => router.push("/admin/invite")}
      className="rounded-full bg-[#b8860b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#9f7308]"
    >
      Invitations
    </button>

    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-[#1d3a4a]/10 bg-white/70 px-4 py-2 text-xs font-semibold text-[#1d3a4a]/70 transition hover:bg-white"
    >
      Logout
    </button>
  </div>
        </header>

        {/* Successful guest */}
        {scannerState === "success" && result?.guest ? (
          <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_70px_rgba(29,58,74,0.14)]">
            <div className="bg-[#1d3a4a] px-6 py-8 text-center text-white sm:px-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
                ✓
              </div>

              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-white/60">
                Invited Guest
              </p>

              <h2 className="mt-2 font-[family-name:var(--font-great-vibes)] text-5xl text-[#e0b444]">
                {result.guest.name}
              </h2>
            </div>

            <div className="px-6 py-7 text-center sm:px-10 sm:py-9">
              <p className="font-[family-name:var(--font-cormorant)] text-xl leading-relaxed text-[#1d3a4a]/75">
                Welcome to the celebration of love,
                <br />
                family and forever.
              </p>

              <div className="my-7 flex items-center gap-3 text-[#b8860b]">
                <span className="h-px flex-1 bg-[#b8860b]/20" />
                <span>♥</span>
                <span className="h-px flex-1 bg-[#b8860b]/20" />
              </div>

              <button
                type="button"
                onClick={resetScanner}
                className="h-13 rounded-2xl bg-[#b8860b] px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-[#9f7308]"
              >
                Scan Next Guest
              </button>
            </div>
          </section>
        ) : scannerState === "not-found" ? (
          <section className="rounded-[2rem] border border-red-100 bg-white p-7 text-center shadow-[0_20px_70px_rgba(29,58,74,0.12)] sm:p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
              ×
            </div>

            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-red-400">
              Not Found
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl font-semibold">
              Guest Not Invited
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#1d3a4a]/60">
              This guest could not be found on the wedding
              invitation list.
            </p>

            <button
              type="button"
              onClick={resetScanner}
              className="mt-7 rounded-2xl bg-[#1d3a4a] px-7 py-3 font-semibold text-white"
            >
              Try Again
            </button>
          </section>
        ) : (
          <>
            {/* Scanner */}
            <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_70px_rgba(29,58,74,0.12)]">
              <div className="px-5 pt-6 text-center sm:px-8">
                <p className="text-[0.7rem] uppercase tracking-[0.3em] text-[#1d3a4a]/50">
                  Invitation Scanner
                </p>

                <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-2xl font-semibold">
                  Scan Guest QR Code
                </h2>

                <p className="mt-2 text-sm text-[#1d3a4a]/55">
                  Point the camera at the guest&apos;s
                  invitation QR code.
                </p>
              </div>

              <div className="relative mx-5 mt-6 overflow-hidden rounded-[1.5rem] bg-[#07181d] sm:mx-8">
                <video
                  ref={videoRef}
                  className="aspect-square w-full object-cover"
                  muted
                  playsInline
                />

                {/* Scanner frame */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-56 w-56 rounded-3xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)] sm:h-64 sm:w-64">
                    <span className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-[#e0b444]" />
                    <span className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-[#e0b444]" />
                    <span className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-[#e0b444]" />
                    <span className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-[#e0b444]" />

                    {scannerState === "scanning" && (
                      <span className="absolute left-3 right-3 top-1/2 h-0.5 animate-pulse bg-[#e0b444]" />
                    )}
                  </div>
                </div>

                {scannerState !== "scanning" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#07181d]/70 px-6 text-center">
                    <div>
                      <div className="mb-3 text-4xl">▣</div>

                      <p className="text-sm text-white/80">
                        Camera scanner is ready
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {scannerError && (
                <div className="mx-5 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 sm:mx-8">
                  {scannerError}
                </div>
              )}

              <div className="px-5 py-6 sm:px-8">
                {scannerState === "scanning" ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopScanner();
                      setScannerState("ready");
                    }}
                    className="h-14 w-full rounded-2xl border border-[#1d3a4a]/10 bg-[#f4fafc] font-semibold transition hover:bg-[#eaf3f6]"
                  >
                    Stop Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startScanner}
                    className="h-14 w-full rounded-2xl bg-[#1d3a4a] font-semibold text-white shadow-lg transition hover:bg-[#152d3a]"
                  >
                    Start Camera Scanner
                  </button>
                )}
              </div>
            </section>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#1d3a4a]/10" />
              <span className="text-xs uppercase tracking-[0.25em] text-[#1d3a4a]/40">
                or
              </span>
              <span className="h-px flex-1 bg-[#1d3a4a]/10" />
            </div>

            {/* Manual search */}
            <section className="rounded-[2rem] bg-white p-5 shadow-[0_20px_70px_rgba(29,58,74,0.10)] sm:p-8">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-[#1d3a4a]/50">
                Manual Check-In
              </p>

              <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-2xl font-semibold">
                Search Guest Name
              </h2>

              <p className="mt-2 text-sm text-[#1d3a4a]/55">
                Use this if the guest&apos;s QR code cannot
                be scanned.
              </p>

              <form
                onSubmit={handleGuestSearch}
                className="mt-5 flex gap-2"
              >
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchError("");
                  }}
                  placeholder="e.g. John Doe"
                  className="h-14 min-w-0 flex-1 rounded-2xl border border-[#1d3a4a]/10 bg-[#f8fbfc] px-4 outline-none transition placeholder:text-[#1d3a4a]/30 focus:border-[#b8860b]/50 focus:ring-4 focus:ring-[#b8860b]/10"
                />

                <button
                  type="submit"
                  disabled={searchLoading}
                  className="h-14 rounded-2xl bg-[#b8860b] px-5 font-semibold text-white transition hover:bg-[#9f7308] disabled:opacity-50"
                >
                  {searchLoading ? "..." : "Search"}
                </button>
              </form>

              {searchError && (
                <p className="mt-3 text-sm text-red-500">
                  {searchError}
                </p>
              )}

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#1d3a4a]/10">
                  {searchResults.map((guest, index) => (
                    <button
                      key={`${guest.name}-${index}`}
                      type="button"
                      onClick={() => selectGuest(guest)}
                      className="flex w-full items-center justify-between border-b border-[#1d3a4a]/10 px-4 py-4 text-left transition last:border-0 hover:bg-[#f4fafc]"
                    >
                      <div>
                        <p className="font-semibold">
                          {guest.name}
                        </p>

                        <p className="mt-1 text-xs text-[#1d3a4a]/50">
                          Invited guest
                        </p>
                      </div>

                      <span className="text-[#b8860b]">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="py-8 text-center">
          <p className="font-[family-name:var(--font-great-vibes)] text-2xl text-[#b8860b]">
            Forever begins on 19.12.26
          </p>
        </footer>
      </div>
    </main>
  );
}

/*
 * QR codes can contain either:
 *
 * https://domain.com/invite/abc123
 *
 * or simply:
 *
 * abc123
 *
 * This function handles both.
 */
function extractInvitationToken(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    const parts = url.pathname.split("/").filter(Boolean);

    const inviteIndex = parts.indexOf("invite");

    if (inviteIndex !== -1 && parts[inviteIndex + 1]) {
      return parts[inviteIndex + 1];
    }

    return null;
  } catch {
    /*
     * Not a URL.
     *
     * Treat it as a raw token.
     */
    return trimmed;
  }
}