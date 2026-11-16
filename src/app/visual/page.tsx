import { notFound } from "next/navigation";
import { isVisualHarness } from "@/lib/env";
import { Gallery } from "./gallery";

// The visual harness route. A 404 unless VISUAL_HARNESS is set, which
// nothing but scripts/visual/run.mjs sets and no deployment ever does.
// The proxy refuses it first; this is the second layer.
export default function VisualPage() {
  if (!isVisualHarness()) {
    notFound();
  }
  return <Gallery />;
}
