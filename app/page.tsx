import type { Metadata } from "next";
import WeddingLanding from "./components/wedding/wedding-landing";
import "./wedding.css";

export const metadata: Metadata = {
  title: "Tobore & Ebunoluwa | Forever After · 19 December 2026",
  description:
    "Join us in celebrating Tobore and Ebunoluwa on 19 December 2026 in Lagos. A little magic, a lifetime of love, and our favourite people.",
};

export default function HomePage() {
  return <WeddingLanding />;
}
