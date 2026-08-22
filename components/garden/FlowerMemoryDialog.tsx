// Effects and refs let React operate the browser's native dialog element.
import { useEffect, useRef } from "react";
// The dialog displays the same memory object carried by the 3D flower.
import type { FlowerMemory } from "./flower-memory";

// The parent supplies the selected memory and decides what closing means.
type FlowerMemoryDialogProps = {
  // This flower's information is rendered inside the dialog.
  flower: FlowerMemory;
  // This callback clears the selected flower in Garden.tsx.
  onClose: () => void;
};

// Use the browser's modal dialog behavior for focus, backdrop, and Escape support.
export function FlowerMemoryDialog({
  flower,
  onClose,
}: FlowerMemoryDialogProps) {
  // Keep direct access to the underlying `<dialog>` DOM element.
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open the dialog modally after React places it in the document.
  useEffect(() => {
    // Store the current element so cleanup refers to the same dialog.
    const dialog = dialogRef.current;
    // `showModal` moves focus inside and makes the rest of the page inert.
    dialog?.showModal();
    // Close the browser dialog if React removes this module first.
    return () => dialog?.close();
  }, []);

  // Render semantic dialog content tied to its visible heading.
  return (
    <dialog
      ref={dialogRef}
      className="flower-memory"
      aria-labelledby="flower-memory-title"
      // Escape triggers `cancel`; preventing its default lets React own the state.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {/* This small label explains what kind of content the card contains. */}
      <p className="flower-memory-kicker">A living memory</p>
      {/* The id connects this visible heading to the dialog's accessible name. */}
      <h2 id="flower-memory-title">{flower.name}</h2>
      {/* Only identified flowers have a botanical name to display. */}
      {flower.latinName && <em>{flower.latinName}</em>}
      {/* The note turns identification data into something personal. */}
      <p className="flower-memory-note">{flower.note}</p>
      {/* Closing returns the visitor to first-person exploration. */}
      <button onClick={onClose}>return to the garden</button>
    </dialog>
  );
}
