import React, { useState, useEffect } from "react";

export default function GenericPage({ title, subtitle }: { title: string, subtitle: string }) {
  useEffect(() => {
     window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="w-full pt-32 pb-24 px-6 min-h-[70vh] flex flex-col items-center text-center fade-in">
       <div className="w-16 h-16 rounded-[12px] bg-[rgba(168,255,53,0.1)] flex items-center justify-center mb-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
             <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
       </div>
       <h1 className="text-[36px] md:text-[48px] font-bold text-white mb-6">{title}</h1>
       <p className="text-[18px] text-[var(--text-3)] max-w-[600px] leading-relaxed mb-12">
          {subtitle}
       </p>
       
       <div className="card p-8 max-w-[800px] w-full text-left">
          <h2 className="text-[20px] font-semibold text-white mb-4">Under Development</h2>
          <p className="text-[14px] text-[var(--text-3)]">
             This is a demonstration placeholder for the <strong>{title}</strong> page. In a full production environment, this page would contain detailed marketing copy, product diagrams, and specific feature breakdowns.
          </p>
       </div>
    </div>
  );
}
