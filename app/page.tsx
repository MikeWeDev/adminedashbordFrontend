import { redirect } from "next/navigation"; // Corrected import syntax

export default function Home() {
  return (
    redirect("/admine")
  );
}
