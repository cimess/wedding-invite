"use client";

import { useState } from "react";
import QRCode from "qrcode";

type InvitationQRProps = {
  token: string;
  guestName: string;
  table?: string;
  seat?: string;
  isAdmin?: boolean;
};

export default function InvitationQR({
  isAdmin = true,
  token,
  guestName,
  table = "Reserved Guest Area",
  seat,
}: InvitationQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

  const invitationUrl = `${origin}/invite/${token}`;

  async function generateQR() {
    setGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(invitationUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: "#2c2820",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
    } finally {
      setGenerating(false);
    }
  }

  /*
   * Generates and downloads a luxury split-card image:
   * Left side: Couple names, venue, date, guest name & table seating
   * Right side: High-contrast scannable QR code & brand seal
   */
  async function downloadCard() {
    if (!qrDataUrl) return;

    const width = 1200;
    const height = 630;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background - Warm Paper Ivory
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(0, 0, width, height);

    // Subtle texture / border
    ctx.strokeStyle = "#d9d0be";
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Inner gold border
    ctx.strokeStyle = "#91754c";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(42, 42, width - 84, height - 84);

    // Split dividing dashed/dotted line
    const splitX = 660;
    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "#cbbfa8";
    ctx.lineWidth = 2;
    ctx.moveTo(splitX, 55);
    ctx.lineTo(splitX, height - 55);
    ctx.stroke();
    ctx.setLineDash([]);

    // Decorative circle notch at divider top & bottom
    ctx.fillStyle = "#e8e1d2";
    ctx.beginPath();
    ctx.arc(splitX, 42, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(splitX, height - 42, 12, 0, Math.PI * 2);
    ctx.fill();

    // LEFT SIDE: Invitation typography
    // Eyebrow
    ctx.fillStyle = "#8a7e6b";
    ctx.font = "600 13px sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText("WEDDING INVITATION & ACCESS PASS", 80, 110);

    // Couple Names
    ctx.fillStyle = "#34372f";
    ctx.font = "italic 52px serif";
    ctx.fillText("Tobore & Ebunoluwa", 80, 180);

    // Thin accent line
    ctx.fillStyle = "#91754c";
    ctx.fillRect(80, 210, 80, 2);

    // Guest Info Section
    ctx.fillStyle = "#8a7e6b";
    ctx.font = "12px sans-serif";
    ctx.fillText("GUEST OF HONOUR", 80, 260);

    ctx.fillStyle = "#2c2820";
    ctx.font = "bold 28px serif";
    ctx.fillText(guestName, 80, 300);

    // Seating Arrangement Box
    ctx.fillStyle = "#ece6d8";
    ctx.fillRect(80, 335, 480, 75);
    ctx.strokeStyle = "#91754c";
    ctx.lineWidth = 1;
    ctx.strokeRect(80, 335, 480, 75);

    ctx.fillStyle = "#7a6e58";
    ctx.font = "600 11px sans-serif";
    ctx.fillText("SEAT ARRANGEMENT", 105, 362);

    ctx.fillStyle = "#91754c";
    ctx.font = "bold 20px serif";
    const seatingText = seat ? `${table} — Seat ${seat}` : table;
    ctx.fillText(seatingText, 105, 393);

    // Event Date & Venue Info
    ctx.fillStyle = "#5c574c";
    ctx.font = "14px sans-serif";
    ctx.fillText("Saturday, 19 December 2026", 80, 455);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#7a7467";
    ctx.fillText("The NAFOWA Hall, Sam Ethnan Air Force Base, Lagos", 80, 480);

    // Left Footer
    ctx.fillStyle = "#9c9382";
    ctx.font = "italic 15px serif";
    ctx.fillText("Forever begins on 19.12.26 ✧", 80, 545);

    // RIGHT SIDE: QR Code + Scan Instruction
    // Header for QR side
    ctx.fillStyle = "#8a7e6b";
    ctx.font = "600 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CHECK-IN ADMIT PASS", splitX + (width - splitX) / 2, 110);

    // Draw the QR Code image
    const qrImage = new window.Image();
    qrImage.crossOrigin = "anonymous";
    qrImage.onload = () => {
      const qrSize = 310;
      const qrX = splitX + ((width - splitX) - qrSize) / 2;
      const qrY = 145;

      // QR backing border
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.strokeStyle = "#91754c";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // QR footer label
      ctx.fillStyle = "#5c574c";
      ctx.font = "12px sans-serif";
      ctx.fillText("Present this code at reception", splitX + (width - splitX) / 2, 505);



      // Trigger download
      const downloadLink = document.createElement("a");
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.download = `${guestName.replace(/[^a-zA-Z0-9]/g, "_")}_Invitation_Pass.png`;
      downloadLink.click();
    };
    qrImage.src = qrDataUrl;
  }

  async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to fallback
      }
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      textArea.remove();
      return successful;
    } catch {
      return false;
    }
  }

  async function shareInvitation() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Wedding Invitation for ${guestName}`,
          text: `You are warmly invited to the wedding celebration of Tobore & Ebunoluwa.`,
          url: invitationUrl,
        });
        return;
      } catch {
        // User dismissed share dialog or share failed, fallback to copy
      }
    }

    const copiedOk = await copyToClipboard(invitationUrl);
    if (copiedOk) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="space-y-6">
      {!qrDataUrl ? (
        <button
          type="button"
          onClick={generateQR}
          disabled={generating}
          className="inline-flex items-center gap-3 rounded-full bg-[#34372f] px-6 py-3.5 text-xs font-semibold tracking-wider text-[#f7f4ee] transition hover:bg-[#91754c] disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {generating ? "PREPARING..." : "GENERATE PASS & QR ↗"}
        </button>
      ) : (
        <div className="space-y-5">
          {/* Split Card Preview */}
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#d9d0be] bg-[#f7f4ee] p-6 shadow-md text-[#34372f]">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              {/* Left Column (3/5) */}
              <div className="md:col-span-3 text-left space-y-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#8a7e6b] font-medium">
                  Tobore & Ebunoluwa ✧ Wedding Pass
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#2c2820]">
                  {guestName}
                </h3>
                <div className="inline-block rounded-lg border border-[#91754c]/40 bg-[#eee6d6] px-3 py-1.5 text-xs font-medium text-[#7a643d]">
                  Table: <span className="font-semibold text-[#2c2820]">{table}</span>
                  {seat && <span> · Seat {seat}</span>}
                </div>
                <p className="text-xs text-[#6e685b] leading-relaxed">
                  Saturday, 19 Dec 2026 · The NAFOWA Hall, Lagos
                </p>
              </div>

              {/* Right Column (2/5): QR preview */}
              <div className="md:col-span-2 flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-[#d9d0be]">
                <img
                  src={qrDataUrl}
                  alt={`QR code pass for ${guestName}`}
                  className="h-40 w-40 object-contain"
                />
                <span className="mt-2 text-[9px] uppercase tracking-wider text-[#91754c] font-mono font-medium">
                  Admit Pass
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={downloadCard}
              className="inline-flex items-center gap-2 rounded-full bg-[#91754c] px-5 py-2.5 text-xs font-semibold tracking-wider text-white shadow-sm transition hover:bg-[#7a613d] cursor-pointer"
            >
              <span>Download Split Pass Card</span>
              <span aria-hidden="true">↓</span>
            </button>

            {isAdmin &&<button
              type="button"
              onClick={shareInvitation}
              className="inline-flex items-center gap-2 rounded-full border border-[#91754c] bg-transparent px-5 py-2.5 text-xs font-semibold tracking-wider text-[#34372f] transition hover:bg-[#91754c]/10 cursor-pointer"
            >
              <span>{copied ? "Link Copied! ✓" : "Share Invitation Link"}</span>
              <span aria-hidden="true">↗</span>
            </button>
            }
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const ok = await copyToClipboard(invitationUrl);
                if (ok) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }
              }}
              title="Click to copy link"
              className="mx-auto max-w-xl flex items-center justify-between gap-3 w-full break-all rounded-xl border border-[#d9d0be]/80 bg-white/90 px-4 py-2.5 text-xs text-[#736c5f] transition hover:border-[#91754c] hover:bg-white text-left cursor-pointer group"
            >
              <span className="font-mono text-[11px] truncate">{invitationUrl}</span>
              <span className="text-[10px] uppercase font-semibold text-[#91754c] shrink-0 group-hover:underline">
                {copied ? "Copied! ✓" : "Copy"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}