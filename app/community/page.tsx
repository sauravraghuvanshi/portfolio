import { getProfile, getEvents } from "@/lib/content";
import { BreadcrumbListSchema } from "@/components/JsonLd";
import CommunityContent from "@/components/sections/CommunityContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Impact — Saurav Raghuvanshi",
  description:
    "Community leadership, developer advocacy, and inclusive tech education — organizing events, mentoring founders, and driving Azure adoption across India.",
};

export default function CommunityPage() {
  const profile = getProfile();
  const events = getEvents();

  const cityCount = new Set(
    events.filter((e) => e.location).map((e) => e.location!.city)
  ).size;

  const communityStats = [
    { value: "30K+", label: "Engineers Trained" },
    { value: "70+", label: "Sessions Delivered" },
    { value: String(events.length), label: "Community Events" },
    { value: `${cityCount}+`, label: "Cities Reached" },
  ];

  const previewEvents = events
    .filter((e) => e.featured)
    .concat(events.filter((e) => !e.featured))
    .slice(0, 4);

  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Community", url: "/community" },
        ]}
      />
      <CommunityContent
        communityRoles={profile.community}
        communityStats={communityStats}
        previewEvents={previewEvents}
        aboutLong={profile.aboutLong}
      />
    </>
  );
}
