"use client";

import { Command } from "cmdk";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  Layers,
  FolderKanban,
  Mic2,
  Calendar,
  Sun,
  Moon,
  Download,
  ExternalLink,
  Linkedin,
  Github,
  Twitter,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SearchItem {
  title: string;
  description?: string;
  url: string;
  type: "blog" | "case-study" | "project" | "talk" | "event";
}

interface CommandPaletteProps {
  searchIndex: SearchItem[];
  socialLinks: {
    linkedin: string;
    github: string;
    twitter: string;
    calendly: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { label: "Home", url: "/" },
  { label: "About", url: "/#about" },
  { label: "Skills", url: "/#skills" },
  { label: "Case Studies", url: "/case-studies" },
  { label: "Blog", url: "/blog" },
  { label: "Projects", url: "/projects" },
  { label: "Talks", url: "/talks" },
  { label: "Events", url: "/events" },
  { label: "Social", url: "/social" },
  { label: "Resume", url: "/resume" },
];

const TYPE_ICONS: Record<SearchItem["type"], React.ElementType> = {
  blog: FileText,
  "case-study": Layers,
  project: FolderKanban,
  talk: Mic2,
  event: Calendar,
};

const TYPE_LABELS: Record<SearchItem["type"], string> = {
  blog: "Blog",
  "case-study": "Case Study",
  project: "Project",
  talk: "Talk",
  event: "Event",
};

const ITEM_CLASS = cn(
  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer select-none",
  "text-slate-700 dark:text-slate-300",
  "data-[selected=true]:bg-brand-50 data-[selected=true]:dark:bg-brand-950/40",
  "data-[selected=true]:text-brand-600 data-[selected=true]:dark:text-brand-400",
  "outline-none transition-colors",
);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CommandPalette({ searchIndex, socialLinks }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const router = useRouter();

  // Sync theme state on mount + listen for external changes
  useEffect(() => {
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };
    syncTheme();

    const handler = (e: Event) => {
      setTheme((e as CustomEvent).detail as "light" | "dark");
    };
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router],
  );

  const openExternal = useCallback((url: string) => {
    setOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
    setOpen(false);
  }, [theme]);

  const downloadResume = useCallback(() => {
    setOpen(false);
    const a = document.createElement("a");
    a.href = "/Saurav_Raghuvanshi_Resume.pdf";
    a.download = "Saurav_Raghuvanshi_Resume.pdf";
    a.click();
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      filter={(value, search) => {
        const v = value.toLowerCase();
        const s = search.toLowerCase();
        // Substring match first (fast path)
        if (v.includes(s)) return 1;
        // Subsequence fuzzy match
        let j = 0;
        for (let i = 0; i < v.length && j < s.length; i++) {
          if (v[i] === s[j]) j++;
        }
        return j === s.length ? 0.5 : 0;
      }}
      className="fixed inset-0 z-[100]"
    >
      <DialogTitle className="sr-only">Command palette</DialogTitle>

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm cmdk-overlay"
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh] px-4">
        <div
          className={cn(
            "w-full max-w-lg rounded-2xl overflow-hidden cmdk-dialog",
            "bg-white dark:bg-slate-900",
            "border border-slate-200 dark:border-slate-800",
            "shadow-2xl",
          )}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <Command.Input
              placeholder="Search pages, posts, actions..."
              className={cn(
                "w-full py-3 text-sm bg-transparent",
                "text-slate-900 dark:text-white",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "outline-none",
              )}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-80 overflow-y-auto p-2 scroll-smooth">
            <Command.Empty className="py-8 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:dark:text-slate-500">
              {NAV_ITEMS.map((item) => (
                <Command.Item
                  key={item.url}
                  value={`go to ${item.label}`}
                  onSelect={() => navigate(item.url)}
                  className={ITEM_CLASS}
                >
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Content */}
            <Command.Group heading="Content" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:dark:text-slate-500">
              {searchIndex.map((item) => {
                const Icon = TYPE_ICONS[item.type];
                return (
                  <Command.Item
                    key={`${item.type}-${item.title}`}
                    value={`${item.title} ${item.description ?? ""}`}
                    onSelect={() => navigate(item.url)}
                    className={ITEM_CLASS}
                  >
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{item.title}</span>
                      {item.description && (
                        <span className="block text-xs text-slate-500 dark:text-slate-500 truncate">
                          {item.description}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide flex-shrink-0">
                      {TYPE_LABELS[item.type]}
                    </span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Actions */}
            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:dark:text-slate-500">
              <Command.Item value="Toggle theme dark light mode" onSelect={toggleTheme} className={ITEM_CLASS}>
                {theme === "dark" ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                <span>Toggle Theme</span>
                <span className="ml-auto text-xs text-slate-400">{theme === "dark" ? "→ Light" : "→ Dark"}</span>
              </Command.Item>
              <Command.Item value="Download resume PDF" onSelect={downloadResume} className={ITEM_CLASS}>
                <Download className="w-4 h-4 text-slate-400" />
                <span>Download Resume</span>
              </Command.Item>
              <Command.Item value="LinkedIn profile social" onSelect={() => openExternal(socialLinks.linkedin)} className={ITEM_CLASS}>
                <Linkedin className="w-4 h-4 text-slate-400" />
                <span>Open LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
              </Command.Item>
              <Command.Item value="GitHub profile code" onSelect={() => openExternal(socialLinks.github)} className={ITEM_CLASS}>
                <Github className="w-4 h-4 text-slate-400" />
                <span>Open GitHub</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
              </Command.Item>
              <Command.Item value="Twitter X profile social" onSelect={() => openExternal(socialLinks.twitter)} className={ITEM_CLASS}>
                <Twitter className="w-4 h-4 text-slate-400" />
                <span>Open Twitter / X</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
              </Command.Item>
              <Command.Item value="Book a call meeting calendly" onSelect={() => openExternal(socialLinks.calendly)} className={ITEM_CLASS}>
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <span>Book a Call</span>
                <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
