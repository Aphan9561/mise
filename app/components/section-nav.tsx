"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Boxes,
  Compass,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

type SectionDef = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Active classes — solid fill in the section color. */
  active: string;
  /** Idle icon tint, so links read as distinct even when not active. */
  idleIcon: string;
};

const SECTIONS: SectionDef[] = [
  {
    label: "Cookbook",
    href: "/recipes",
    icon: BookOpen,
    active: "border-mise-accent bg-mise-accent text-mise-page",
    idleIcon: "text-mise-accent",
  },
  {
    label: "Pantry",
    href: "/pantry",
    icon: Boxes,
    active: "border-mise-gold bg-mise-gold text-mise-page",
    idleIcon: "text-mise-gold",
  },
  {
    label: "Grocery",
    href: "/grocery",
    icon: ShoppingBasket,
    active: "border-mise-warm bg-mise-warm text-mise-page",
    idleIcon: "text-mise-warm",
  },
  {
    label: "Discover",
    href: "/discover",
    icon: Compass,
    active: "border-mise-ink bg-mise-ink text-mise-page",
    idleIcon: "text-mise-ink",
  },
];

export function SectionNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Sections"
      className="flex flex-wrap items-center gap-1.5"
    >
      {SECTIONS.map(({ label, href, icon: Icon, active, idleIcon }) => {
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[11px] font-semibold uppercase transition sm:text-xs ${
              isActive
                ? active
                : "border-mise-border bg-mise-surface text-mise-ink hover:border-mise-ink"
            }`}
            style={{ letterSpacing: "0.14em" }}
          >
            <Icon
              size={14}
              aria-hidden="true"
              className={isActive ? "text-mise-page" : idleIcon}
            />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
