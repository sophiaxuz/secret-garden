// Effects and refs let React operate the browser's native dialog element.
import { useEffect, useRef } from "react";
// The dialog renders shared identity and kind-specific encounter language.
import { GARDEN_ITEM_LANGUAGE, type GardenItem } from "./garden-item";

// The parent supplies the selected garden item and decides what closing means.
type GardenInspectionDialogProps = {
  // This flower, tree, or animal's information is rendered inside the card.
  item: GardenItem;
  // This callback clears the selected item in Garden.tsx.
  onClose: () => void;
};

// Use the native modal behavior for focus, backdrop, and Escape support.
export function GardenInspectionDialog({
  item,
  onClose,
}: GardenInspectionDialogProps) {
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
      className="garden-inspection"
      aria-labelledby="garden-inspection-title"
      // Escape triggers `cancel`; preventing its default lets React own state.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {/* Shared language gives each kind its own emotional frame. */}
      <p className="garden-inspection-kicker">
        {GARDEN_ITEM_LANGUAGE[item.kind].kicker}
      </p>
      {/* The id connects this visible heading to the dialog's accessible name. */}
      <h2 id="garden-inspection-title">{item.name}</h2>
      {/* Identified flowers, trees, and animals may carry a scientific name. */}
      {item.latinName && <em>{item.latinName}</em>}
      {/* The note gives the encounter a personal or historical voice. */}
      <p className="garden-inspection-note">{item.note}</p>
      {/* Closing returns the visitor to first-person exploration. */}
      <button onClick={onClose}>return to the garden</button>
    </dialog>
  );
}
