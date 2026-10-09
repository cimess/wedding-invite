// lib/guests.ts

export type Guest = {
  token: string;
  name: string;
};

const guests: Guest[] = [
  {
    token: "8xK2mP7qL9vR4tW1",
    name: "John Doe",
  },
  {
    token: "3nF8sQ2zA6kM9pX4",
    name: "Jane Smith",
  },
  {
    token: "7bY4cN9hT2wL6rP8",
    name: "Michael Johnson",
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