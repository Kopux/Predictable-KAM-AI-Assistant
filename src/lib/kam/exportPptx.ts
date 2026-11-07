import type { Slide } from "./story";
import { ATTENDEES, type Attendee } from "./store";

export async function exportPptx(customerName: string, summary: string, slides: Slide[], attendees: Attendee[], aiSession?: string) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  const BG = "00205B";
  const FG = "FFFFFF";
  const ACC = "4FB3E8";

  const title = pptx.addSlide();
  title.background = { color: BG };
  title.addText("Customer Value & Sustainability Review 2025", { x: 0.6, y: 1.6, w: 12, fontSize: 18, color: ACC, bold: true });
  title.addText(customerName, { x: 0.6, y: 2.2, w: 12, fontSize: 44, color: FG, bold: true, fontFace: "Arial" });
  title.addText(summary, { x: 0.6, y: 3.6, w: 11.5, h: 2.6, fontSize: 16, color: FG, valign: "top" });

  slides.forEach((s, i) => {
    const sl = pptx.addSlide();
    sl.background = { color: BG };
    sl.addText(s.kicker.toUpperCase(), { x: 0.6, y: 0.4, w: 8, fontSize: 12, color: ACC, bold: true, charSpacing: 3 });
    sl.addText(`${i + 1}`, { x: 12, y: 0.4, w: 0.8, fontSize: 12, color: FG, align: "right" });
    sl.addText(s.title, { x: 0.6, y: 0.8, w: 12, h: 1, fontSize: 30, color: FG, bold: true });
    s.big.forEach((b, j) => {
      sl.addText(b.value, { x: 0.6 + j * 4.1, y: 2.2, w: 4, fontSize: 36, color: ACC, bold: true });
      sl.addText(b.label, { x: 0.6 + j * 4.1, y: 2.9, w: 4, fontSize: 14, color: FG });
    });
    sl.addText(
      s.bullets.map((b) => ({ text: b, options: { bullet: true } })),
      { x: 0.6, y: s.big.length ? 3.9 : 2.2, w: 12, h: 3, fontSize: 18, color: FG, valign: "top", paraSpaceAfter: 8 },
    );
    const notes = attendees
      .flatMap((a) => (s.talking[a] ?? []).map((t) => `[${ATTENDEES.find((x) => x.id === a)?.label}] ${t}`))
      .join("\n");
    if (notes) sl.addNotes(notes);
  });

  if (aiSession) {
    const qa = pptx.addSlide();
    qa.background = { color: BG };
    qa.addText("AI DATA Q&A (PREP NOTES)", { x: 0.6, y: 0.4, w: 12, fontSize: 12, color: ACC, bold: true });
    qa.addText(aiSession.slice(0, 2500), { x: 0.6, y: 0.9, w: 12, h: 6.2, fontSize: 11, color: FG, valign: "top" });
    qa.addNotes(aiSession);
  }

  await pptx.writeFile({ fileName: `${customerName.replace(/\s+/g, "_")}_review_2025.pptx` });
}
