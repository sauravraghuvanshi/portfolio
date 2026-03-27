import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getAllBlogPosts } from "@/lib/content";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { sharedMDXComponents } from "@/lib/mdx-components";
import { ArrowLeft, ArrowRight, Calendar, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BlogPostSchema, BreadcrumbListSchema } from "@/components/JsonLd";
import ScrollProgress from "@/components/ui/ScrollProgress";
import TableOfContents from "@/components/ui/TableOfContents";
import ShareButtons from "@/components/ui/ShareButtons";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post || post.status === "draft") notFound();

  const allPosts = getAllBlogPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  // Related posts: same category, excluding current post, max 3
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.category.some((c) => post.category.includes(c)))
    .slice(0, 3);
  // If fewer than 3 category matches, fill with recent posts
  if (relatedPosts.length < 3) {
    const slugsUsed = new Set([slug, ...relatedPosts.map((p) => p.slug)]);
    for (const p of allPosts) {
      if (relatedPosts.length >= 3) break;
      if (!slugsUsed.has(p.slug)) relatedPosts.push(p);
    }
  }

  let content;
  try {
    ({ content } = await compileMDX({
      source: post.content,
      options: {
        parseFrontmatter: false,
        mdxOptions: { remarkPlugins: [remarkGfm] },
      },
      components: sharedMDXComponents,
    }));
  } catch (err) {
    console.error("MDX compilation error:", err);
    content = <p className="text-red-500">Error rendering content. The markdown may contain invalid syntax.</p>;
  }

  return (
    <>
      <ScrollProgress />
      <BlogPostSchema
        title={post.title}
        description={post.description}
        slug={post.slug}
        tags={post.tags}
        datePublished={post.date}
        dateModified={post.updated || post.date}
        coverImage={post.coverImage}
      />
      <BreadcrumbListSchema items={[
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: post.title, url: `/blog/${post.slug}` },
      ]} />
    <div className="pt-24 pb-16 section-padding">
      <div className="max-w-7xl mx-auto">
        {/* Grid: content + ToC sidebar */}
        <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-12">
        <div className="max-w-3xl">
        {/* Back navigation */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Article header */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.category.map((cat) => (
              <Badge key={cat} variant="blue">{cat}</Badge>
            ))}
            {post.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {post.description}
          </p>

          {/* Meta row + share */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {post.readingTime}
            </span>
            {post.externalUrl && (
              <a
                href={post.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Originally on {post.externalSource || "External"}
              </a>
            )}
            </div>
            <ShareButtons title={post.title} url={`/blog/${post.slug}`} />
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="mt-8 aspect-video relative rounded-2xl overflow-hidden">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </header>

        {/* MDX content */}
        <article className="prose-custom" aria-label={`Blog post: ${post.title}`}>
          {content}
        </article>

        {/* Bottom share */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">Enjoyed this post?</p>
          <ShareButtons title={post.title} url={`/blog/${post.slug}`} />
        </div>

        {/* Prev / Next navigation */}
        <nav className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="group flex items-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">Previous</p>
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{prevPost.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="group flex items-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200 text-right sm:flex-row-reverse"
            >
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              <div className="min-w-0 sm:text-right">
                <p className="text-xs text-slate-500 mb-0.5">Next</p>
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{nextPost.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Related Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200"
                >
                  <p className="text-xs text-slate-500 mb-1.5">{formatDate(rp.date)}</p>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                    {rp.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{rp.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-10 p-8 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-950/30 dark:to-accent-950/30 border border-brand-200/50 dark:border-brand-800/50 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Want to discuss this topic?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-5">
            I&apos;d love to hear your thoughts on cloud architecture and AI.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/#contact"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
            >
              Get in Touch
            </a>
            <Link
              href="/blog"
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold rounded-xl text-sm transition-all"
            >
              More Posts
            </Link>
          </div>
        </div>
        </div>
        {/* ToC sidebar — xl only */}
        <TableOfContents />
        </div>
      </div>
    </div>
    </>
  );
}
