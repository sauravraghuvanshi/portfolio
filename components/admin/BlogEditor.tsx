"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Save,
  Eye,
  ImagePlus,
  Youtube,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import type { BlogPost } from "@/lib/content";
import MediaResizeBar from "./MediaResizeBar";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface BlogEditorProps {
  mode: "create" | "edit";
  initialData?: BlogPost;
}

const categories = [
  "General",
  "Azure",
  "Cloud Architecture",
  "API Management",
  "DevOps",
  "Security",
  "AI & ML",
  "Web Development",
];

export default function BlogEditor({ mode, initialData }: BlogEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Insert text at cursor position in the editor's textarea
  function insertAtCursor(text: string) {
    const textarea = editorRef.current?.querySelector("textarea");
    if (!textarea) {
      // Fallback: append to content
      setContent((prev) => prev + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newVal = before + text + after;
    setContent(newVal);
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    });
  }

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "General");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status ?? "draft"
  );
  const [externalUrl, setExternalUrl] = useState(initialData?.externalUrl ?? "");
  const [externalSource, setExternalSource] = useState(
    initialData?.externalSource ?? ""
  );
  const [content, setContent] = useState(initialData?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showMeta, setShowMeta] = useState(true);
  const [activeMedia, setActiveMedia] = useState<{
    type: "img" | "youtube";
    identifier: string;
    label: string;
    width: string;
  } | null>(null);

  // Regex-replace width attribute for a specific media element in the markdown
  function updateMediaWidth(
    src: string,
    mediaType: "img" | "youtube",
    identifier: string,
    newWidth: string
  ): string {
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (mediaType === "img") {
      return src.replace(
        new RegExp(`(<img[^>]*src="${escaped}"[^>]*width=")([^"]*)(")`, "g"),
        `$1${newWidth}$3`
      );
    }
    return src.replace(
      new RegExp(`(<YouTubeEmbed[^>]*videoId="${escaped}"[^>]*width=")([^"]*)(")`, "g"),
      `$1${newWidth}$3`
    );
  }

  function handleMediaResize(newWidth: string) {
    if (!activeMedia) return;
    const updated = updateMediaWidth(content, activeMedia.type, activeMedia.identifier, newWidth);
    setContent(updated);
    setActiveMedia((prev) => (prev ? { ...prev, width: newWidth } : null));
  }

  // Detect if cursor is on a media line and show the resize bar
  function detectMediaAtCursor(text: string, cursorPos: number) {
    const lineStart = text.lastIndexOf("\n", cursorPos - 1) + 1;
    const lineEnd = text.indexOf("\n", cursorPos);
    const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

    const imgMatch = line.match(/<img[^>]*src="([^"]*)"[^>]*width="([^"]*)"/);
    if (imgMatch) {
      return {
        type: "img" as const,
        identifier: imgMatch[1],
        label: imgMatch[1].split("/").pop() || "Image",
        width: imgMatch[2],
      };
    }

    const ytMatch = line.match(/<YouTubeEmbed[^>]*videoId="([^"]*)"[^>]*width="([^"]*)"/);
    if (ytMatch) {
      return {
        type: "youtube" as const,
        identifier: ytMatch[1],
        label: `YouTube: ${ytMatch[1]}`,
        width: ytMatch[2],
      };
    }
    return null;
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    if (mode === "edit" && initialData?.slug) {
      formData.append("slug", initialData.slug);
    }
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  }

  async function handleInsertImage() {
    fileInputRef.current?.click();
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage({ type: "success", text: "Uploading image..." });
    const url = await uploadImage(file);
    if (url) {
      insertAtCursor(`\n<img src="${url}" alt="${file.name}" width="100%" />\n`);
      setActiveMedia({ type: "img", identifier: url, label: file.name, width: "100%" });
      setMessage({ type: "success", text: "Image inserted! Use the size bar to resize." });
    } else {
      setMessage({ type: "error", text: "Image upload failed" });
    }
    e.target.value = "";
  }

  async function handleCoverImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      setCoverImage(url);
    }
    e.target.value = "";
  }

  function handleInsertYouTube() {
    const url = prompt("Enter YouTube video URL:");
    if (!url) return;
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) {
      insertAtCursor(`\n<YouTubeEmbed videoId="${match[1]}" title="Video" width="100%"></YouTubeEmbed>\n`);
      setActiveMedia({ type: "youtube", identifier: match[1], label: `YouTube: ${match[1]}`, width: "100%" });
    } else {
      setMessage({ type: "error", text: "Invalid YouTube URL" });
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      title,
      description,
      category,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      coverImage: coverImage || undefined,
      featured,
      status,
      content,
      externalUrl: externalUrl || undefined,
      externalSource: externalSource || undefined,
    };

    const url =
      mode === "create"
        ? "/api/admin/blog"
        : `/api/admin/blog/${initialData!.slug}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    // Handle non-JSON responses (e.g., HTML error pages or redirects)
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      setMessage({ type: "error", text: `Server error (${res.status}): unexpected response` });
      return;
    }

    const data = await res.json();

    if (res.ok) {
      setMessage({
        type: "success",
        text: mode === "create" ? "Post created!" : "Post updated!",
      });
      if (mode === "create" && data.slug) {
        router.push(`/admin/blog/${data.slug}/edit`);
      } else {
        router.refresh();
      }
    } else {
      setMessage({ type: "error", text: data.error || "Something went wrong" });
    }
  }

  // Detect media at cursor when user clicks or moves cursor in editor
  const handleCursorActivity = useCallback(() => {
    const textarea = editorRef.current?.querySelector("textarea");
    if (!textarea) return;
    const detected = detectMediaAtCursor(textarea.value, textarea.selectionStart);
    if (detected) {
      setActiveMedia(detected);
    }
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.addEventListener("click", handleCursorActivity);
    el.addEventListener("keyup", handleCursorActivity);
    return () => {
      el.removeEventListener("click", handleCursorActivity);
      el.removeEventListener("keyup", handleCursorActivity);
    };
  }, [handleCursorActivity]);

  // Custom image command that opens file picker instead of inserting placeholder
  const imageUploadCommand = useCallback(() => ({
    name: "image",
    keyCommand: "image",
    buttonProps: { "aria-label": "Upload image", title: "Upload image" },
    icon: (
      <svg width="13" height="13" viewBox="0 0 20 20">
        <path
          fill="currentColor"
          d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
        />
      </svg>
    ),
    execute: () => {
      fileInputRef.current?.click();
    },
  }), []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowMeta((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-dark px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          {showMeta ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showMeta ? "Hide Details" : "Post Details"}
        </button>
        <button
          onClick={handleInsertImage}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-dark px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          <ImagePlus className="h-4 w-4" />
          Insert Image
        </button>
        <button
          onClick={handleInsertYouTube}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-dark px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          <Youtube className="h-4 w-4" />
          YouTube
        </button>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={initialData ? `/blog/${initialData.slug}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-dark px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 ${!initialData ? "pointer-events-none opacity-40" : ""}`}
          >
            <Eye className="h-4 w-4" />
            Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={handleImageSelected}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={handleCoverImageSelected}
      />

      {/* Status message */}
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Media resize bar */}
      {activeMedia && (
        <MediaResizeBar
          mediaLabel={activeMedia.label}
          currentWidth={activeMedia.width}
          onResize={handleMediaResize}
          onDismiss={() => setActiveMedia(null)}
        />
      )}

      {/* Metadata panel */}
      {showMeta && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-surface-dark p-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
              placeholder="Post title..."
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
              placeholder="Short description for SEO and previews..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white outline-none transition focus:border-brand-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Tags (comma-separated)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
              placeholder="azure, api, cloud"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Cover Image
            </label>
            <div className="flex gap-2">
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
                placeholder="/blog/images/..."
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                className="rounded-lg border border-slate-700 bg-surface-dark-2 px-3 text-slate-400 transition hover:text-white"
                title="Upload cover image"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white outline-none transition focus:border-brand-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-surface-dark-2 accent-brand-600"
              />
              Featured post
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              External URL
            </label>
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              External Source
            </label>
            <input
              value={externalSource}
              onChange={(e) => setExternalSource(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500"
              placeholder="e.g., Microsoft Tech Community"
            />
          </div>
        </div>
      )}

      {/* Content editor */}
      <div data-color-mode="dark" className="min-h-[500px]" ref={editorRef}>
        <MDEditor
          value={content}
          onChange={(val) => setContent(val ?? "")}
          height={600}
          preview="live"
          visibleDragbar={false}
          commands={undefined}
          extraCommands={undefined}
          previewOptions={{
            components: {
              img: (({ src, alt, width: imgWidth, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => {
                const w = imgWidth as string | undefined;
                const hasCustomWidth = w && w !== "100%";
                return (
                  <span
                    className="block my-4"
                    style={hasCustomWidth ? { maxWidth: w, margin: "0 auto" } : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={alt || ""} className="rounded-xl w-full" loading="lazy" {...rest} />
                  </span>
                );
              }) as React.ComponentType<React.ImgHTMLAttributes<HTMLImageElement>>,
            },
          }}
          commandsFilter={(cmd) => {
            // Replace the built-in image command with our file-upload version
            if (cmd.name === "image") {
              return imageUploadCommand();
            }
            return cmd;
          }}
          onDrop={async (e) => {
            const file = e.dataTransfer?.files?.[0];
            if (file && file.type.startsWith("image/")) {
              e.preventDefault();
              setMessage({ type: "success", text: "Uploading image..." });
              const url = await uploadImage(file);
              if (url) {
                insertAtCursor(`\n<img src="${url}" alt="${file.name}" width="100%" />\n`);
                setActiveMedia({ type: "img", identifier: url, label: file.name, width: "100%" });
                setMessage({ type: "success", text: "Image inserted! Use the size bar to resize." });
              } else {
                setMessage({ type: "error", text: "Image upload failed" });
              }
            }
          }}
          onPaste={async (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
              if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                  setMessage({ type: "success", text: "Uploading image..." });
                  const url = await uploadImage(file);
                  if (url) {
                    insertAtCursor(`\n<img src="${url}" alt="pasted-image" width="100%" />\n`);
                    setActiveMedia({ type: "img", identifier: url, label: "pasted-image", width: "100%" });
                    setMessage({ type: "success", text: "Image inserted! Use the size bar to resize." });
                  } else {
                    setMessage({ type: "error", text: "Image upload failed" });
                  }
                }
                break;
              }
            }
          }}
        />
      </div>
    </div>
  );
}
