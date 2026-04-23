"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, Search, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = {
  label: string;
  href: string;
  description?: string;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavLink[];
};

type NavEntry = NavLink | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => "items" in entry;

const navEntries: NavEntry[] = [
  { label: "About", href: "/#about" },
  {
    label: "Work",
    items: [
      { label: "Case Studies", href: "/case-studies", description: "Deep-dives into shipped cloud architectures and outcomes." },
      { label: "Projects", href: "/projects", description: "Open-source and personal builds across cloud and AI." },
    ],
  },
  {
    label: "Writing",
    items: [
      { label: "Blog", href: "/blog", description: "Technical posts on cloud, AI, and architecture patterns." },
      { label: "Talks", href: "/talks", description: "Conference and meetup talks with recordings." },
      { label: "Events", href: "/events", description: "Bootcamps, workshops, and community events I’ve hosted." },
    ],
  },
  {
    label: "Labs",
    items: [
      {
        label: "Architecture Playground",
        href: "/playground",
        description: "Drag-and-drop Azure / AWS / GCP icons, animate sequences, export PNG · GIF · JSON.",
      },
    ],
  },
  {
    label: "Connect",
    items: [
      { label: "Community", href: "/community", description: "Mentorship and the communities I contribute to." },
      { label: "Social", href: "/social", description: "LinkedIn, GitHub, X, and other public channels." },
    ],
  },
  { label: "Resume", href: "/resume" },
];

// Selector for focusable elements inside the mobile drawer (used for focus trap).
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const navListRef = useRef<HTMLUListElement | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // After mount, read the real theme from localStorage / system preference.
  // setState-in-effect is intentional here: this is a one-time read of browser-only
  // state (localStorage + matchMedia) that cannot run during SSR. The `mounted` flag
  // gates the second effect to prevent the cascading render concern the rule warns about.
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const actual = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(actual);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme, mounted]);

  // Sync theme when toggled externally (e.g. from CommandPalette)
  useEffect(() => {
    const handler = (e: Event) => {
      setTheme((e as CustomEvent).detail as "light" | "dark");
    };
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Mobile drawer: Escape to close + focus trap + restore focus on close.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const trigger = menuTriggerRef.current;

    // Move focus into the drawer on next tick (after mount + animation start).
    const focusFrame = requestAnimationFrame(() => {
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusables[0] ?? drawer).focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = Array.from(
        drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to the trigger (or previously focused element) when closing.
      const target = trigger ?? previouslyFocusedRef.current;
      target?.focus?.();
    };
  }, [isOpen]);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, [theme]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href;
  };

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  // Close any open dropdown on outside click or Escape, and clean up the hover-close timer.
  useEffect(() => {
    if (!openMenu) return;
    const handlePointer = (e: MouseEvent) => {
      if (!navListRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openMenu]);

  // Close any open dropdown on route change (covers programmatic navigation).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenMenu((m) => (m ? null : m));
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    };
  }, []);

  const openMenuFor = (label: string) => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current);
      menuCloseTimer.current = null;
    }
    setOpenMenu(label);
  };

  const scheduleCloseMenu = () => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>

      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm"
            : "bg-transparent"
        )}
        role="banner"
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main navigation">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg"
            aria-label="Saurav Raghuvanshi — Digital Cloud Solution Architect, go to home"
          >
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-glow group-hover:shadow-glow-strong transition-shadow">
              SR
            </div>
            <span className="font-semibold text-slate-900 dark:text-white hidden sm:block">
              Saurav Raghuvanshi
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-normal leading-none">Cloud Architect · Microsoft</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <ul ref={navListRef} className="hidden md:flex items-center gap-1" role="list">
            {navEntries.map((entry) => {
              if (!isGroup(entry)) {
                return (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                        isActive(entry.href)
                          ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {entry.label}
                    </Link>
                  </li>
                );
              }

              const groupId = `nav-menu-${entry.label.toLowerCase()}`;
              const open = openMenu === entry.label;
              const active = isGroupActive(entry);
              return (
                <li
                  key={entry.label}
                  className="relative"
                  onMouseEnter={() => openMenuFor(entry.label)}
                  onMouseLeave={scheduleCloseMenu}
                >
                  <button
                    type="button"
                    onClick={() => setOpenMenu((m) => (m === entry.label ? null : entry.label))}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      active || open
                        ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    )}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-controls={groupId}
                  >
                    {entry.label}
                    <ChevronDown
                      className={cn("w-3.5 h-3.5 transition-transform", open ? "rotate-180" : "rotate-0")}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        id={groupId}
                        role="menu"
                        aria-label={entry.label}
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-slate-900/10 dark:shadow-black/40 p-2 z-50"
                      >
                        {entry.label === "Labs" && (
                          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                            Experiments &amp; tools
                          </div>
                        )}
                        {entry.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={() => setOpenMenu(null)}
                            className={cn(
                              "block rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                              pathname === item.href
                                ? "bg-brand-50 dark:bg-brand-950/50"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  pathname === item.href
                                    ? "text-brand-600 dark:text-brand-400"
                                    : "text-slate-900 dark:text-white"
                                )}
                              >
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-600 text-white">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                                {item.description}
                              </p>
                            )}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search / Command palette trigger */}
            <button
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="hidden md:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 text-xs"
              aria-label="Open command palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-slate-400 dark:text-slate-500">Search...</span>
              <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-400">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
            >
              {!mounted || theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              href="/#contact"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Hire Me
            </Link>

            {/* Mobile menu button */}
            <button
              ref={menuTriggerRef}
              onClick={() => setIsOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-menu"
              ref={drawerRef}
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-slate-900 z-50 shadow-2xl md:hidden flex flex-col focus:outline-none"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
                {navEntries.map((entry, i) => {
                  const delay = i * 0.04;
                  if (!isGroup(entry)) {
                    return (
                      <motion.div
                        key={entry.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay }}
                      >
                        <Link
                          href={entry.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                            isActive(entry.href)
                              ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50"
                              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          {entry.label}
                        </Link>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={entry.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay }}
                      className="pt-3 mt-1"
                    >
                      <div className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        {entry.label === "Labs" && <Sparkles className="w-3 h-3" aria-hidden="true" />}
                        {entry.label}
                      </div>
                      {entry.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                            pathname === item.href
                              ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50"
                              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-600 text-white">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <Link
                  href="/#contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Hire Me
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
