// A one-page test rejection notice (lettuce at Sunbelt Markets) for the upload test.
import { writeFileSync } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";
const doc = await PDFDocument.create();
const page = doc.addPage([612, 792]);
const font = await doc.embedFont(StandardFonts.Helvetica);
const lines = ["SUNBELT MARKETS - RECEIVING REJECTION NOTICE (TEST)", "Carrier: Truck 08, Salinas Ridge Farms", "Commodity: Romaine lettuce, 10 pallets", "Grade observed: U.S. No. 2", "Pulp temperature: 3 C", "Defects: 9% tip burn and bruising on outer leaves", "Decision: REJECTED - tip burn above retail tolerance"];
lines.forEach((l, i) => page.drawText(l, { x: 50, y: 730 - i * 22, size: i ? 12 : 14, font }));
writeFileSync(process.argv[2], await doc.save());
console.log("wrote", process.argv[2]);
