import { getAllBlogPosts } from "@/lib/content";
import BlogGrid from "@/components/sections/BlogGrid";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Technical blog on Azure architecture, Generative AI, cloud-native engineering, and platform building — by Saurav Raghuvanshi.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="pt-24 pb-16 section-padding">
      <div className="section-container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">
            Technical Blog
          </p>
          <h1 className="heading-lg text-slate-900 dark:text-white mb-4">
            Thoughts on Cloud &amp; AI
          </h1>
          <p className="body-lg text-slate-600 dark:text-slate-400">
            Deep dives into Azure architecture, Generative AI, platform
            engineering, and lessons learned building cloud-native systems at
            scale.
          </p>
        </div>
        <BlogGrid posts={posts} />
      </div>
    </div>
  );
}
