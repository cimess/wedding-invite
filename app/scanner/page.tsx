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
import Link from "next/link";
import { useRouter } from "next/navigation";

type Guest = {
  name: string;
  table?: string;
  seat?: string;
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

export default function ScannerPage() {
  const router = useRouter();
  const [scannerState, setScannerState] = useState<ScannerState>("checking");

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
   * Check whether this browser has a valid session.
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
   * Login
   */
  async function handleAuthentication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pin.trim()) {
      setPinError("Please enter the staff access PIN.");
      return;
    }

    setPinLoading(true);
    setPinError("");

    try {
      const response = await fetch("/api/scanner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPinError(data.error ?? "Invalid staff PIN.");
        return;
      }

      setPin("");
      setScannerState("ready");
    } catch {
      setPinError("Connection error. Please try again.");
    } finally {
      setPinLoading(false);
    }
  }

  /*
   * Guest lookup by QR token
   */
  const verifyGuest = useCallback(async (token: string) => {
    if (!token.trim()) return;

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
        setScannerError(data?.guest ? "" : "Unable to verify this invitation code.");
        setScannerState("error");
        return;
      }

      if (!data.invited) {
        setResult({ invited: false });
        setScannerState("not-found");
        return;
      }

      setResult(data);
      setScannerState("success");
    } catch {
      setScannerError("Network error. Please check your connection.");
      setScannerState("error");
    }
  }, []);

  /*
   * Search guest by name
   */
  async function handleGuestSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();

    if (!query) {
      setSearchError("Please type a guest name.");
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
        setSearchError(data.error ?? "Unable to search guests.");
        return;
      }

      setSearchResults(data.guests ?? []);

      if (!data.guests?.length) {
        setResult({ invited: false });
        setScannerState("not-found");
      }
    } catch {
      setSearchError("Network error. Please check your connection.");
    } finally {
      setSearchLoading(false);
    }
  }

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
   * Start camera scanner
   */
  async function startScanner() {
    setScannerError("");
    setResult(null);
    setScannerState("scanning");

    if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
      setScannerError("Camera scanning requires HTTPS or localhost. Browsers block camera access over insecure HTTP (e.g. http://192.168.x.x). Please use localhost, HTTPS, or look up the guest by name below.");
      setScannerState("error");
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setScannerError("Camera API is not supported or permitted in this browser. Please search for the guest by name below.");
      setScannerState("error");
      return;
    }

    try {
      if (!videoRef.current) {
        throw new Error("Scanner video element is unavailable.");
      }

      controlsRef.current?.stop();
      const reader = new BrowserMultiFormatReader();

      let controls: IScannerControls;
      try {
        // Try back / environment camera first
        controls = await reader.decodeFromConstraints(
          {
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          },
          videoRef.current,
          (scanResult) => {
            if (!scanResult) return;
            const text = scanResult.getText();
            if (!text) return;

            const token = extractInvitationToken(text);
            if (!token) {
              setScannerError("This QR code is not a valid wedding pass.");
              return;
            }

            controlsRef.current?.stop();
            controlsRef.current = null;
            verifyGuest(token);
          }
        );
      } catch (backCamError) {
        console.warn("Falling back to default camera:", backCamError);
        // Fallback to any available video stream (laptop webcam / front camera)
        controls = await reader.decodeFromConstraints(
          {
            video: true,
            audio: false,
          },
          videoRef.current,
          (scanResult) => {
            if (!scanResult) return;
            const text = scanResult.getText();
            if (!text) return;

            const token = extractInvitationToken(text);
            if (!token) {
              setScannerError("This QR code is not a valid wedding pass.");
              return;
            }

            controlsRef.current?.stop();
            controlsRef.current = null;
            verifyGuest(token);
          }
        );
      }

      controlsRef.current = controls;
    } catch (error: unknown) {
      console.error(error);
      const errName = (error as { name?: string })?.name || "";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setScannerError("Camera permission was denied. Please allow camera access in your browser settings or search by name.");
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setScannerError("No camera found on this device. Please search for guests by name below.");
      } else {
        setScannerError("Camera access failed. Please ensure permission is granted or search by name below.");
      }
      setScannerState("error");
    }
  }

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }

  function resetScanner() {
    stopScanner();
    setResult(null);
    setSearch("");
    setSearchResults([]);
    setSearchError("");
    setScannerError("");
    setScannerState("ready");
  }

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

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  /*
   * CHECKING STATE
   */
  if (scannerState === "checking") {
    return (
      <main className="min-h-screen bg-[#f7f4ee] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#91754c]/30 border-t-[#91754c]" />
          <p className="font-serif text-lg italic text-[#7a643d]">
            Preparing wedding check-in pass...
          </p>
        </div>
      </main>
    );
  }

  /*
   * LOCKED STATE (PIN Screen)
   */
  if (scannerState === "locked") {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-5 py-12 text-[#34372f] flex items-center justify-center">
        <div className="w-full max-w-md">
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[#d9d0be] bg-white p-8 md:p-10 text-center shadow-lg">
            <div className="pointer-events-none absolute inset-3 rounded-[2rem] border border-[#91754c]/20" />

            {/* Monogram Seal */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#91754c]/30 bg-[#f7f4ee] text-2xl shadow-sm">
              <span className="font-serif italic text-[#91754c]">T&amp;E</span>
            </div>

            <p className="text-[10px] uppercase tracking-[0.3em] text-[#91754c] font-semibold">
              Reception Staff Access
            </p>

            <h1 className="mt-2 font-serif text-3xl font-medium text-[#2c2820]">
              Wedding Check-In
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-xs text-[#736c5f] leading-relaxed">
              Enter the staff PIN code to start scanning guest admission QR codes.
            </p>

            <form onSubmit={handleAuthentication} className="mt-8 space-y-4">
              <div>
                <input
                  id="scanner-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="••••"
                  className="h-13 w-full rounded-2xl border border-[#d9d0be] bg-[#f7f4ee] px-5 text-center text-xl font-mono tracking-[0.4em] outline-none transition focus:border-[#91754c] focus:ring-4 focus:ring-[#91754c]/10 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm text-[#2c2820]"
                />
              </div>

              {pinError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600 border border-red-200">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                disabled={pinLoading}
                className="h-13 w-full rounded-full bg-[#34372f] px-6 text-xs font-semibold tracking-wider text-white shadow-sm transition hover:bg-[#91754c] disabled:opacity-60 cursor-pointer"
              >
                {pinLoading ? "AUTHENTICATING..." : "ENTER SCANNER ↗"}
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-[#ece6d8] flex justify-between items-center text-[11px] text-[#8a7e6b]">
              <Link href="/" className="hover:text-[#91754c] transition">
                ← Wedding Home
              </Link>
              <span>Authorized Staff</span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /*
   * MAIN SCANNER DASHBOARD
   */
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-6 text-[#34372f] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-7 flex items-center justify-between border-b border-[#d9d0be] pb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#91754c] font-semibold">
              Reception Desk
            </p>
            <h1 className="mt-1 font-serif text-3xl md:text-4xl font-normal text-[#2c2820]">
              Tobore <em>&amp;</em> Ebunoluwa
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/invite")}
              className="rounded-full border border-[#91754c] bg-white px-4 py-2 text-xs font-semibold text-[#91754c] transition hover:bg-[#91754c] hover:text-white"
            >
              Invites List
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-[#d9d0be] bg-white/70 px-4 py-2 text-xs font-semibold text-[#736c5f] transition hover:bg-white"
            >
              Exit
            </button>
          </div>
        </header>

        {/* ---------------- SUCCESS RESULT ---------------- */}
        {scannerState === "success" && result?.guest ? (
          <section className="overflow-hidden rounded-[2.5rem] border border-[#d9d0be] bg-white shadow-xl">
            {/* Top Verified Banner */}
            <div className="bg-[#34372f] px-6 py-8 text-center text-[#f7f4ee] sm:px-10">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#91754c] bg-[#91754c]/30 text-2xl text-[#f7f4ee]">
                ✓
              </div>

              <p className="text-[9px] uppercase tracking-[0.3em] text-[#d9d0be]">
                Verified Guest Admission
              </p>

              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-normal text-white">
                {result.guest.name}
              </h2>
            </div>

            {/* Seating Arrangement Callout */}
            <div className="px-6 py-8 text-center sm:px-10 space-y-6">
              <div className="rounded-2xl border border-[#91754c]/30 bg-[#f7f4ee] p-5 max-w-md mx-auto">
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#91754c] font-semibold">
                  SEAT &amp; TABLE ARRANGEMENT
                </span>
                <p className="mt-2 font-serif text-2xl font-semibold text-[#2c2820]">
                  {result.guest.table || "Reserved Guest Area"}
                </p>
                {result.guest.seat && (
                  <p className="mt-1 text-xs text-[#736c5f]">
                    Seat Number: <strong>{result.guest.seat}</strong>
                  </p>
                )}
              </div>

              <p className="font-serif text-lg italic text-[#736c5f]">
                Warmly welcome the guest to the celebration.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={resetScanner}
                  className="rounded-full bg-[#91754c] px-8 py-3.5 text-xs font-semibold tracking-wider text-white shadow-sm transition hover:bg-[#7a613d] cursor-pointer"
                >
                  SCAN NEXT GUEST →
                </button>
              </div>
            </div>
          </section>
        ) : scannerState === "not-found" ? (
          /* ---------------- NOT FOUND RESULT ---------------- */
          <section className="rounded-[2.5rem] border border-red-200 bg-white p-8 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500 border border-red-200">
              ✕
            </div>

            <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-semibold">
              Pass Not Found
            </p>

            <h2 className="mt-2 font-serif text-2xl font-semibold text-[#2c2820]">
              Guest Not On Invitation List
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#736c5f]">
              This QR code does not match any confirmed wedding invitations. Please try scanning again or look up the guest by name below.
            </p>

            <button
              type="button"
              onClick={resetScanner}
              className="mt-6 rounded-full bg-[#34372f] px-7 py-3 text-xs font-semibold tracking-wider text-white transition hover:bg-[#91754c]"
            >
              Try Again
            </button>
          </section>
        ) : (
          /* ---------------- CAMERA SCANNER + SEARCH ---------------- */
          <>
            {/* Live Camera Viewfinder */}
            <section className="overflow-hidden rounded-[2.5rem] border border-[#d9d0be] bg-white p-6 sm:p-8 shadow-sm">
              <div className="text-center mb-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#91754c] font-semibold">
                  Camera Admission Reader
                </p>
                <h2 className="mt-1 font-serif text-2xl text-[#2c2820]">
                  Scan Guest Invitation QR
                </h2>
                <p className="mt-1 text-xs text-[#736c5f]">
                  Point camera at the printed or digital wedding pass.
                </p>
              </div>

              {/* Viewfinder window */}
              <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-3xl bg-[#1d221c] shadow-inner">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />

                {/* Reticle / Corners */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-48 w-48 sm:h-56 sm:w-56 rounded-2xl border border-white/40 shadow-[0_0_0_999px_rgba(0,0,0,0.4)]">
                    <span className="absolute -left-1 -top-1 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-[#91754c]" />
                    <span className="absolute -right-1 -top-1 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-[#91754c]" />
                    <span className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-[#91754c]" />
                    <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-[#91754c]" />

                    {scannerState === "scanning" && (
                      <span className="absolute left-2 right-2 top-1/2 h-0.5 animate-pulse bg-[#91754c]" />
                    )}
                  </div>
                </div>

                {scannerState !== "scanning" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1d221c]/80 px-6 text-center text-white">
                    <div>
                      <div className="mb-2 text-3xl text-[#91754c]">▣</div>
                      <p className="text-xs text-[#d9d0be]">
                        Camera is on standby
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {scannerError && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-xs text-red-600 border border-red-200">
                  {scannerError}
                </div>
              )}

              <div className="mt-5 text-center">
                {scannerState === "scanning" ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopScanner();
                      setScannerState("ready");
                    }}
                    className="h-12 w-full max-w-xs rounded-full border border-[#d9d0be] bg-[#f7f4ee] text-xs font-semibold tracking-wider text-[#34372f] transition hover:bg-[#ece6d8]"
                  >
                    PAUSE CAMERA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startScanner}
                    className="h-12 w-full max-w-xs rounded-full bg-[#34372f] text-xs font-semibold tracking-wider text-white shadow-sm transition hover:bg-[#91754c]"
                  >
                    START CAMERA SCANNER ↗
                  </button>
                )}
              </div>
            </section>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#d9d0be]" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#8a7e6b]">
                or manual lookup
              </span>
              <span className="h-px flex-1 bg-[#d9d0be]" />
            </div>

            {/* Manual Search by Name */}
            <section className="rounded-[2.5rem] border border-[#d9d0be] bg-white p-6 sm:p-8 shadow-sm">
              <div className="text-center mb-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#91754c] font-semibold">
                  Manual Registry
                </p>
                <h2 className="mt-1 font-serif text-2xl text-[#2c2820]">
                  Search Guest by Name
                </h2>
                <p className="mt-1 text-xs text-[#736c5f]">
                  Look up a guest if they don’t have their QR code.
                </p>
              </div>

              <form onSubmit={handleGuestSearch} className="flex gap-2">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchError("");
                  }}
                  placeholder="e.g. Tunde Yakubu"
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-[#d9d0be] bg-[#f7f4ee] px-4 text-sm text-[#2c2820] outline-none transition focus:border-[#91754c] focus:ring-2 focus:ring-[#91754c]/20"
                />

                <button
                  type="submit"
                  disabled={searchLoading}
                  className="h-12 rounded-2xl bg-[#91754c] px-5 text-xs font-semibold tracking-wider text-white transition hover:bg-[#7a613d] disabled:opacity-50"
                >
                  {searchLoading ? "..." : "SEARCH"}
                </button>
              </form>

              {searchError && (
                <p className="mt-3 text-xs text-red-500 text-center">
                  {searchError}
                </p>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#ece6d8]">
                  {searchResults.map((guest, index) => (
                    <button
                      key={`${guest.name}-${index}`}
                      type="button"
                      onClick={() => selectGuest(guest)}
                      className="flex w-full items-center justify-between border-b border-[#ece6d8] bg-white px-4 py-3.5 text-left transition last:border-0 hover:bg-[#f7f4ee]"
                    >
                      <div>
                        <p className="font-serif text-lg font-medium text-[#2c2820]">
                          {guest.name}
                        </p>
                        <p className="text-[11px] text-[#91754c]">
                          Table: {guest.table || "Reserved Guest Area"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#91754c]">
                        Admit →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-12 text-center text-xs text-[#8a7e6b]">
          Tobore &amp; Ebunoluwa · 19.12.26
        </footer>
      </div>
    </main>
  );
}

function extractInvitationToken(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    const inviteIndex = parts.indexOf("invite");

    if (inviteIndex !== -1 && parts[inviteIndex + 1]) {
      return parts[inviteIndex + 1];
    }
    return null;
  } catch {
    return trimmed;
  }
}
