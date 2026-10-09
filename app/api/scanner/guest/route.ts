import { NextRequest, NextResponse } from "next/server";
import {
  getGuestByToken,
  searchGuestsByName,
} from "@/app/lib/guest";
import { isScannerAuthenticated } from "@/app/lib/scanner.auth";

export async function GET(request: NextRequest) {
  const authenticated = await isScannerAuthenticated();

  if (!authenticated) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const { searchParams } = new URL(request.url);

  const token = searchParams.get("token");
  const name = searchParams.get("name");

  /*
   * QR / barcode lookup
   */
  if (token) {
    const guest = getGuestByToken(token);

    if (!guest) {
      return NextResponse.json({
        invited: false,
      });
    }

    return NextResponse.json({
      invited: true,
      guest: {
        name: guest.name,
      },
    });
  }

  /*
   * Manual name search
   */
  if (name) {
    const guests = searchGuestsByName(name);

    return NextResponse.json({
      invited: guests.length > 0,
      guests: guests.map((guest) => ({
        name: guest.name,
      })),
    });
  }

  return NextResponse.json(
    {
      error: "Token or name is required",
    },
    {
      status: 400,
    }
  );
}