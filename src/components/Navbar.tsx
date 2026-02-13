import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 remember">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">CricSmart</h1>

        <div className="space-x-6">
          <Link href="/matches">Matches</Link>
          <Link href="/players">Players</Link>
          <Link href="/analytics">Analytics</Link>

        </div>
      </div>
    </nav>
  );
}
