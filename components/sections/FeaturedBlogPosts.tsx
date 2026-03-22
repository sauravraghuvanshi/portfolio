"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/content";

interface FeaturedBlogPostsProps {
  posts: BlogPost[];
}

export default function FeaturedBlogPosts({ posts }: FeaturedBlogPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section id="blog" aria-labelledby="blog-heading" className="py-24 section-padding">
      <div className="section-container">
        <SectionHeader
          eyebrow="Technical Blog"
          title="Latest from the Blog"
          description="Deep dives into cloud architecture, AI engineering, and lessons from the field."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group block h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg transition-all duration-300"
              >
                {/* Cover or placeholder */}
                <div className="aspect-video bg-gradient-to-br from-brand-500/10 to-accent-500/10 dark:from-brand-900/30 dark:to-accent-900/30 relative overflow-hidden">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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

                <div className="p-5">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.category.map((cat) => (
                      <Badge key={cat} variant="blue">{cat}</Badge>
                    ))}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readingTime}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold rounded-xl text-sm transition-all"
          >
            View All Posts
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
