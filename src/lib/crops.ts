// What each crop is worth and how long a rejected load of it stays sellable. Fictional but plausible figures
// for the demo farm; prices are per pallet, shelf life is from the moment of rejection at typical cold-chain temps.
export type Crop = "Strawberries" | "Lettuce" | "Tomatoes" | "Peaches";

export const CROPS: Record<Crop, { pricePerPallet: number; shelfHours: number }> = {
  Strawberries: { pricePerPallet: 200_00, shelfHours: 10 },
  Lettuce: { pricePerPallet: 180_00, shelfHours: 30 },
  Tomatoes: { pricePerPallet: 160_00, shelfHours: 48 },
  Peaches: { pricePerPallet: 220_00, shelfHours: 36 },
};

export const isCrop = (c: string): c is Crop => c in CROPS;
