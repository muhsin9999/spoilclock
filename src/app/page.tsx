import { redirect } from "next/navigation";

// The landing page comes later; for now the root opens Today.
export default function Home() {
  redirect("/today");
}
