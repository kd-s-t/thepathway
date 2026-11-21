import recordsData from "@/data/records.json";
import PathReel from "./components/PathReel";

const initialRecords = recordsData.records.filter(
  (n): n is number =>
    typeof n === "number" &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= 1000,
);

export default function Home() {
  return (
    <main className="path-root">
      <PathReel initialRecords={initialRecords} />
    </main>
  );
}
