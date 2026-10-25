// Opens one of the visitor's load files. Photos are served as uploaded. For PDFs we keep only the text the agent
// reads, so a PDF opens as that text, typeset on one page.
import { and, eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db, schema as s } from "@/db";
import { runId } from "@/server/run";

export async function GET(_req: Request, ctx: RouteContext<"/api/files/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const run = await runId();
  const [file] = await db
    .select({ name: s.files.name, type: s.files.type, text: s.files.text, data: s.files.data })
    .from(s.files)
    .innerJoin(s.loads, eq(s.loads.id, s.files.loadId))
    .where(and(eq(s.files.id, id), eq(s.loads.runId, run)));
  if (!file) return new Response("Not found", { status: 404 });
  const headers = { "Content-Disposition": `inline; filename="${file.name}"`, "Cache-Control": "private, no-store" };
  if (file.data) return new Response(new Uint8Array(Buffer.from(file.data, "base64")), { headers: { ...headers, "Content-Type": file.type } });
  if (file.type !== "application/pdf") return new Response(file.text ?? "", { headers: { ...headers, "Content-Type": `${file.type}; charset=utf-8` } });
  return new Response(new Uint8Array(await typeset(file.text ?? "")), { headers: { ...headers, "Content-Type": "application/pdf" } });
}

/** Sample paperwork is stored as text: typeset it as a plain one-page document: the first line as a heading, the rest as body text. */
async function typeset(text: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.12, 0.16, 0.13);
  let y = 730;
  text
    .replace(/°/g, " deg ")
    .split("\n")
    .forEach((line, i) => {
      const font = i === 0 ? bold : body;
      const size = i === 0 ? 14 : 10.5;
      for (const chunk of wrap(line, font, size, 500)) {
        page.drawText(chunk, { x: 56, y, size, font, color: ink });
        y -= i === 0 ? 26 : 16;
      }
      if (!line) y -= 4;
    });
  return pdf.save();
}

function wrap(line: string, font: { widthOfTextAtSize(t: string, s: number): number }, size: number, max: number) {
  const out: string[] = [];
  let cur = "";
  for (const word of line.split(" ")) {
    const next = cur ? `${cur} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > max && cur) {
      out.push(cur);
      cur = word;
    } else cur = next;
  }
  return [...out, cur];
}
