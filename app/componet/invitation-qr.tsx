"use client";

import { useState } from "react";
import QRCode from "qrcode";

type InvitationQRProps = {
  token: string;
  guestName: string;
};

export default function InvitationQR({
  token,
  guestName,
}: InvitationQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

  const invitationUrl = `${origin}/invite/${token}`;

  async function generateQR() {
    const dataUrl = await QRCode.toDataURL(invitationUrl, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    setQrDataUrl(dataUrl);
  }

  function downloadQR() {
    if (!qrDataUrl) return;

    const link = document.createElement("a");

    link.href = qrDataUrl;
    link.download = `${guestName.replace(/\s+/g, "-")}-invitation-qr.png`;

    link.click();
  }

  async function shareInvitation() {
    if (!navigator.share) {
      await navigator.clipboard.writeText(invitationUrl);

      alert("Invitation link copied.");
      return;
    }

    await navigator.share({
      title: `Wedding Invitation for ${guestName}`,
      text: `You are invited to the wedding of Tobore & Ebunoluwa.`,
      url: invitationUrl,
    });
  }

  return (
    <div className="space-y-5">

      {!qrDataUrl ? (
        <button
          type="button"
          onClick={generateQR}
          className="
            rounded-full
            bg-black
            px-6
            py-3
            text-sm
            font-medium
            text-white
            cursor-pointer
          "
        >
          Generate QR Code
        </button>
      ) : (
        <>
          <div className="mx-auto w-fit rounded-2xl bg-white p-5 shadow-lg">
            <img
              src={qrDataUrl}
              alt={`QR code for ${guestName}`}
              className="h-[280px] w-[280px]"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">

            <button
              type="button"
              onClick={downloadQR}
              className="
                rounded-full
                border
                border-black
                px-5
                py-3
                text-sm
                cursor-pointer
              "
            >
              Download QR
            </button>

            <button
              type="button"
              onClick={shareInvitation}
              className="
                rounded-full
                bg-black
                px-5
                py-3
                text-sm
                text-white
                cursor-pointer
              "
            >
              Share Invitation
            </button>

          </div>

          <div className="break-all rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
            {invitationUrl}
          </div>
        </>
      )}
    </div>
  );
}