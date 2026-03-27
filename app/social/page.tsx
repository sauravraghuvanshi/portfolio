import type { Metadata } from "next";
import { BreadcrumbListSchema } from "@/components/JsonLd";
import { Linkedin, Twitter, Github, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Social",
  description:
    "Connect with Saurav Raghuvanshi on LinkedIn, Twitter/X, and GitHub for cloud architecture insights, Azure AI updates, and startup tech content.",
};

const profiles = [
  {
    platform: "LinkedIn",
    handle: "sauravraghuvanshi",
    description:
      "Follow for posts on Azure architecture, Generative AI, cloud-native patterns, and startup scaling — practical content straight from the field.",
    href: "https://www.linkedin.com/in/sauravraghuvanshi/",
    followHref: "https://www.linkedin.com/in/sauravraghuvanshi/",
    followLabel: "View on LinkedIn",
    viewLabel: "View Profile",
    iconBg: "bg-[#0A66C2]",
    btnBg: "bg-[#0A66C2] hover:bg-[#004182]",
    Icon: Linkedin,
  },
  {
    platform: "Twitter / X",
    handle: "@Saurav_Raghu",
    description:
      "Thoughts on cloud, AI, startups, and the Microsoft ecosystem — follow for quick takes and community updates.",
    href: "https://x.com/Saurav_Raghu",
    followHref: "https://x.com/intent/follow?screen_name=Saurav_Raghu",
    followLabel: "Follow on X",
    viewLabel: "View Profile",
    iconBg: "bg-black",
    btnBg: "bg-black hover:bg-zinc-800",
    Icon: Twitter,
  },
  {
    platform: "GitHub",
    handle: "sauravraghuvanshi",
    description:
      "Open-source projects, Azure reference architectures, and code samples from real-world cloud and AI engagements.",
    href: "https://github.com/sauravraghuvanshi",
    followHref: "https://github.com/sauravraghuvanshi",
    followLabel: "View GitHub",
    viewLabel: "View Profile",
    iconBg: "bg-slate-900 dark:bg-slate-700",
    btnBg: "bg-slate-900 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600",
    Icon: Github,
  },
  {
    platform: "Email",
    handle: "sauravraghuvanshi24@gmail.com",
    description:
      "Prefer a direct conversation? Reach out for speaking opportunities, collaborations, or just to say hello.",
    href: "mailto:sauravraghuvanshi24@gmail.com",
    followHref: "mailto:sauravraghuvanshi24@gmail.com",
    followLabel: "Send Email",
    viewLabel: "Send Email",
    iconBg: "bg-brand-600",
    btnBg: "bg-brand-600 hover:bg-brand-700",
    Icon: Mail,
  },
];

export default function SocialPage() {
  return (
    <>
      <BreadcrumbListSchema items={[
        { name: "Home", url: "/" },
        { name: "Social", url: "/social" },
      ]} />
      <div className="py-16 section-padding">
      <div className="section-container max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="heading-lg text-slate-900 dark:text-white mb-3">Connect</h1>
          <p className="body-md max-w-xl mx-auto">
            Follow along for cloud &amp; AI insights, Azure updates, startup content, and community events.
          </p>
        </div>

        {/* Profile cards */}
        <div className="space-y-4">
          {profiles.map(({ platform, handle, description, href, followHref, followLabel, iconBg, btnBg, Icon }) => (
            <div
              key={platform}
              className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">{platform}</p>
                <p className="text-sm text-brand-600 dark:text-brand-400 mb-1">{handle}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
              </div>

              {/* CTA */}
              <a
                href={followHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 ${btnBg} text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 flex-shrink-0`}
              >
                <Icon className="w-4 h-4" />
                {followLabel}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
