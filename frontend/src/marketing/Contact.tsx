import React from "react";
import GenericPage, { PlaceholderCard } from "./GenericPage";

export default function Contact() {
  return (
    <GenericPage
      title="Contact"
      subtitle="Get in touch with the MediSOC team about research collaboration, hospital pilots, or access to evaluation data."
    >
      <PlaceholderCard title="Contact" />
    </GenericPage>
  );
}