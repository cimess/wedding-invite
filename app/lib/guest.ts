// lib/guests.ts

export type Guest = {
  token: string;
  name: string;
};

const guests: Guest[] = [
  {
    token: "8xK2mP7qL9vR4tW1",
    name: "Mr. Tunde Yakubu",
  },
  {
    token: "3nF8sQ2zA6kM9pX4",
    name: "Mrs. Elisha",
  },
  {
    token: "7bY4cN9hT2wL6rP8",
    name: "Mrs. Sabrina Igbodu",
  },
  {
    token: "7bY4cN9hT2wL6yyeuw",
    name: "Mr. Patrick Okpodu",
  },
  {
    token: "7bY4cN9hTeeyy2wL6rP8",
    name: "Mrs. Judith Edo",
  },
  {
    token: "wyyeye65Y4cN9hT2wL6rP8",
    name: "Mr. Judge",
  },
  {
    token: "12663Y4cN9hT2wL6rP8",
    name: "Imoh Ogoh",
  },
  {
    token: "44cN9hTjjjdd2wL6rP8",
    name: "Sherrif",
  },
  {
    token: "33hhjsY4cN9hT2wL6ruud",
    name: "Kezzy",
  },
  {
    token: "22hhdhdhhswL6r664",
    name: "Kloud",
  },
  {
    token: "1122bY4cN9hT2wL6rP8",
    name: "James Memeju",
  },
  {
    token: "8888YuueyyN9hT2wL6rP8",
    name: "Deniro Nuru",
  },
  {
    token: "7bY4cyyeggddL6re2",
    name: "Emma Okoye",
  },
  {
    token: "3663vgshT2wL6rP8",
    name: "Elchino",
  },
  {
    token: "12bY33edhhd2wL6r",
    name: "Fome",
  },
  {
    token: "66335hghsbhcbjhbch",
    name: "Williams",
  },
  {
    token: "7bY4cNdhhssrtte",
    name: "Carl Okoye",
  },
  {
    token: "bhhbgg663322232",
    name: "Emeka Billy Yarns",
  },
  {
    token: "33jjdhhssjjs",
    name:"Bishop Kagho",
  },
  {
    token: "33jjdhhsssjj",
    name: "Simon",
  },
  {
    token: "7bY4cjjjjuuwggw",
    name: "Nonso",
  },
  {
    token: "yywyywggdggd",
    name: "Charlie Porto",
  },
  {
    token: "hhdud77388",
    name: "Chigozie",
  },
];

export function getGuestByToken(token: string): Guest | null {
  return guests.find((guest) => guest.token === token) ?? null;
}

export function searchGuestsByName(query: string): Guest[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return guests
    .filter((guest) =>
      guest.name.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 5);
}

export function getAllGuests(): Guest[] {
  return guests;
}