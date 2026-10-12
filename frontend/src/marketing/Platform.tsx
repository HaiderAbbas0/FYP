import React from "react";
import GenericPage, { PlaceholderCard } from "./GenericPage";

export default function Platform() {
  return (
    <GenericPage
      title="Platform"
      subtitle="Explore the MediSOC architecture, from edge telemetry ingestion through multi-agent investigation and safe, auditable response."
    >
      <PlaceholderCard title="Platform" />
    </GenericPage>
  );
}