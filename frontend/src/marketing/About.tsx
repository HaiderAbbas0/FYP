import React from "react";
import GenericPage, { PlaceholderCard } from "./GenericPage";

export default function About() {
  return (
    <GenericPage
      title="About"
      subtitle="MediSOC is a research-driven healthcare cybersecurity platform built by students and faculty to bring autonomous, clinically aware defence to the Internet of Medical Things."
    >
      <PlaceholderCard title="About" />
    </GenericPage>
  );
}