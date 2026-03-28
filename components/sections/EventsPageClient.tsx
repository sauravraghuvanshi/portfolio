"use client";

import { useState } from "react";
import SpeakingMap from "./SpeakingMap";
import EventsGrid from "./EventsGrid";
import type { CityCluster, Event } from "@/lib/content";

interface EventsPageClientProps {
  events: Event[];
  clusters: CityCluster[];
  virtualCount: number;
}

export default function EventsPageClient({ events, clusters, virtualCount }: EventsPageClientProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  return (
    <>
      <SpeakingMap
        clusters={clusters}
        virtualCount={virtualCount}
        selectedCity={selectedCity}
        onCitySelect={setSelectedCity}
      />
      <EventsGrid
        events={events}
        cityFilter={selectedCity}
        onClearCity={() => setSelectedCity(null)}
      />
    </>
  );
}
