"use client";

import dynamic from "next/dynamic";
import { ChangeEvent, useRef, useState } from "react";

const Garden = dynamic(() => import("@/components/Garden"), { ssr: false });

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [entered, setEntered] = useState(false);
  const [plantedCount, setPlantedCount] = useState(0);
  const [status, setStatus] = useState("");

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus(`Holding ${file.name} up to the light…`);
    event.currentTarget.value = "";
    window.setTimeout(() => {
      setPlantedCount((count) => count + 1);
      setStatus("A new demo bloom is stirring.");
    }, 850);
  }

  return (
    <main className={`world ${entered ? "entered" : ""}`}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={choosePhoto} hidden />
      <Garden plantedCount={plantedCount} />
      <div className="vignette" />
      <div className="grain" />

      <div className="garden-name">The Secret Garden <i>·</i> Spring, first light</div>
      <section className="threshold-copy">
        <p>Somewhere between noticing and remembering</p>
        <h1>There is a garden<br />only you can enter.</h1>
        <button className="enter" onClick={() => setEntered(true)}>cross the threshold <span>→</span></button>
      </section>

      <div className="inside-copy">
        <p>Move slowly.<br />The garden is listening.</p>
        <span>drag to wander · scroll to breathe</span>
      </div>

      <button className="plant-orb" onClick={() => inputRef.current?.click()}>
        <b>＋</b><small>plant<br />a memory</small>
      </button>
      {status && <div className="garden-toast">{status}</div>}
      <div className="memory-tally">{String(3 + plantedCount).padStart(2, "0")} <small>living memories</small></div>
    </main>
  );
}
