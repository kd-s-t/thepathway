import { normalizeRecords } from "@/lib/path-record";
import recordsData from "@/data/records.json";
import PathReel from "./components/PathReel";

const initialRecords = normalizeRecords(recordsData);

export default function Home() {
  return (
    <main className="path-root">
      <PathReel initialRecords={initialRecords} />
    </main>
  );
}
