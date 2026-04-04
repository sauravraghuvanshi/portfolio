"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ImageWithShimmer from "@/components/ui/ImageWithShimmer";
import { ArrowRight, Search, X, Calendar, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/content";

interface BlogGridProps {
  posts: BlogPost[];
}

const categoryVariant: Record<string, "blue" | "green" | "purple" | "orange"> = {
  Azure: "blue",
  "Azure AI": "purple",
  DevOps: "green",
  "Cloud Architecture": "blue",
  "Platform Engineering": "green",
  "Generative AI": "purple",
};

export default function BlogGrid({ posts }: BlogGridProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.flatMap((p) => p.category))).sort()],
    [posts],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return posts.filter((p) => {
      if (activeCategory !== "All" && !p.category.includes(activeCategory)) return false;
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.tags.some((t) => t.toLowerCase().includes(q)) &&
        !p.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [posts, activeCategory, search]);

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-6">
        {filtered.length} {filtered.length === 1 ? "post" : "posts"}
        {activeCategory !== "All" && ` in ${activeCategory}`}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((post, i) => (
            <motion.article
              key={post.slug}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group block h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg transition-all duration-300"
              >
                {/* Cover image or gradient */}
                <div className="aspect-video bg-gradient-to-br from-brand-500/10 to-accent-500/10 dark:from-brand-900/30 dark:to-accent-900/30 relative overflow-hidden">
                  {post.coverImage ? (
                    <ImageWithShimmer
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold gradient-text opacity-30">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  {post.externalUrl && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400">
                      <ExternalLink className="w-3 h-3" />
                      External
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {post.category.map((cat) => (
                      <Badge key={cat} variant={categoryVariant[cat] || "default"}>
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  <h2 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readingTime}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-brand-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">
            No posts found. Try a different search or category.
          </p>
        </div>
      )}
    </div>
  );
}
