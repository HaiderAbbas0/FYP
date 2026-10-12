import React from "react";
import GenericPage, { PlaceholderCard } from "./GenericPage";

export default function Integrations() {
  return (
    <GenericPage
      title="Integrations"
      subtitle="Connect MediSOC to your hospital infrastructure — MQTT brokers, HL7 and DICOM interfaces, SIEM platforms, and clinical monitoring systems."
    >
      <PlaceholderCard title="Integrations" />
    </GenericPage>
  );
}