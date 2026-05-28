import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      className="px-6 py-4 remember"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        background: "var(--nav-bg)",
        borderBottom: "0.5px solid var(--nav-border)",
      }}
    >
      <div className="flex justify-between items-center">
        <h1 style={{ fontFamily: "var(--font-display)", color: "var(--text-1)", fontSize: 18 }}>CricSmart</h1>

        <div className="space-x-6">
          <Link href="/matches" style={{ color: "var(--text-2)", fontWeight: 500, fontSize: 14 }}>
            Matches
          </Link>
          <Link href="/players" style={{ color: "var(--text-2)", fontWeight: 500, fontSize: 14 }}>
            Players
          </Link>
          <Link href="/analytics" style={{ color: "var(--text-2)", fontWeight: 500, fontSize: 14 }}>
            Analytics
          </Link>
        </div>
      </div>
    </nav>
  );
}
