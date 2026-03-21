import YouTubeEmbed from "@/components/ui/YouTubeEmbed";
import type { MDXComponents } from "mdx/types";

export const sharedMDXComponents: MDXComponents = {
  h2: ({ children, ...props }) => (
    <h2
      className="text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-4 scroll-mt-24"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-3 scroll-mt-24"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p
      className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4"
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-none space-y-2 mb-6" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="list-decimal list-inside space-y-2 mb-6 text-slate-700 dark:text-slate-300"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li
      className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-sm leading-relaxed"
      {...props}
    >
      <span
        className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong
      className="font-semibold text-slate-900 dark:text-white"
      {...props}
    >
      {children}
    </strong>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-brand-500 pl-6 py-2 my-6 bg-brand-50 dark:bg-brand-950/30 rounded-r-xl"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          className={`block bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl p-6 overflow-x-auto text-sm font-mono leading-relaxed my-6 ${className}`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="bg-slate-900 dark:bg-slate-950 rounded-xl overflow-x-auto my-6 p-0"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-8 rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-slate-50 dark:bg-slate-800/50" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-6 py-4 text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800"
      {...props}
    >
      {children}
    </td>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:no-underline transition-colors"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-10 border-slate-200 dark:border-slate-800" />,
  img: ({ src, alt, width, ...props }: { src?: string; alt?: string; width?: string; [key: string]: unknown }) => {
    const hasCustomWidth = width && width !== "100%";
    return (
      <span
        className="block my-8"
        style={hasCustomWidth ? { maxWidth: width, margin: "0 auto" } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || ""}
          className="rounded-xl w-full"
          loading="lazy"
          {...props}
        />
        {alt && (
          <span className="block text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
            {alt}
          </span>
        )}
      </span>
    );
  },
  YouTubeEmbed: YouTubeEmbed as unknown as React.ComponentType<Record<string, unknown>>,
};
