import { Feed } from "feed";
import { getAllBlogPosts } from "@/lib/content";
import { SITE_URL } from "@/lib/constants";

export async function GET() {
  const posts = getAllBlogPosts();

  const feed = new Feed({
    title: "Saurav Raghuvanshi — Cloud Architecture & AI Blog",
    description:
      "Insights on Azure architecture, generative AI, cloud-native platforms, and startup engineering from a Digital Cloud Solution Architect at Microsoft.",
    id: SITE_URL,
    link: SITE_URL,
    language: "en",
    copyright: `All rights reserved ${new Date().getFullYear()}, Saurav Raghuvanshi`,
    author: {
      name: "Saurav Raghuvanshi",
      link: SITE_URL,
    },
    feedLinks: {
      rss2: `${SITE_URL}/feed.xml`,
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${SITE_URL}/blog/${post.slug}`,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.description,
      date: new Date(post.date),
      author: [{ name: "Saurav Raghuvanshi", link: SITE_URL }],
      category: post.category.map((c) => ({ name: c })),
      ...(post.coverImage ? { image: post.coverImage } : {}),
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
