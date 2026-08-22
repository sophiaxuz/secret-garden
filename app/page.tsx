"use client";

import dynamic from "next/dynamic";
import { ChangeEvent, useRef, useState } from "react";

const Garden = dynamic(() => import("@/components/Garden"), { ssr: false });

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [plantedCount, setPlantedCount] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "reading" | "planted">("idle");
  const [fileName, setFileName] = useState("");

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadStatus("reading");
    event.currentTarget.value = "";
    window.setTimeout(() => {
      setPlantedCount((count) => count + 1);
      setUploadStatus("planted");
    }, 700);
  }

  return (
    <main>
      <div className="grain" />
      <header>
        <a className="brand" href="#top" aria-label="The Secret Garden home">
          <span className="brand-mark">S</span>
          <span>The Secret Garden</span>
        </a>
        <div className="season" title="Seasonal lifecycle preview"><span /> Spring preview</div>
        <button className="sound" disabled title="Soundscape coming soon">◌ Soundscape · soon</button>
      </header>

      <section className="hero" id="top">
        <div className="copy">
          <p className="eyebrow">A PLACE FOR WHAT MOVES YOU</p>
          <h1>Every encounter<br />leaves a <em>seed.</em></h1>
          <p className="intro">Photograph a plant that catches your eye.<br />Watch it take root in a garden that is entirely yours.</p>
          <div className="actions">
            <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={choosePhoto} hidden />
            <button className="primary" onClick={() => inputRef.current?.click()}>
              <span className="camera">▣</span> Plant a memory <span>↗</span>
            </button>
            <button className="text-button" onClick={() => document.querySelector("canvas")?.scrollIntoView({ behavior: "smooth" })}>Explore your garden <span>↓</span></button>
          </div>
          {uploadStatus !== "idle" && <p className="status">{uploadStatus === "planted" ? "A demo bloom has taken root — identification comes next." : `Preparing a demo bloom from ${fileName}…`}</p>}
        </div>

        <div className="garden-wrap" aria-label="Interactive three-dimensional flower garden">
          <Garden plantedCount={plantedCount} />
          <div className="hint"><span>↔</span> Drag to wander</div>
          <div className="plant-count"><strong>{String(3 + plantedCount).padStart(2, "0")}</strong><span>memories<br />in bloom</span></div>
        </div>
      </section>

      <footer>
        <p>“What we attend to becomes part of our inner garden.”</p>
        <div className="weather" title="Atmosphere preview"><span>☼</span><span>Spring<small>Soft morning light</small></span></div>
      </footer>
    </main>
  );
}
