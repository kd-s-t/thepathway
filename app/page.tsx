import { readRecords } from "@/lib/records";
import PathReel from "./components/PathReel";

export default async function Home() {
  const records = await readRecords();

  return (
    <main>
      <PathReel initialRecords={records} />
    </main>
  );
}
