import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Offers - SocialMart",
  description: "Manage your offers and negotiations",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
