export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return ""; // browser → relative works
  }

  // server → absolute URL required
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}