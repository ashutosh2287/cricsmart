export function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  return slug || "item";
}

export async function generateUniqueSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let attempt = 1;

  while (await checkExists(slug)) {
    slug = `${base}-${attempt}`;
    attempt += 1;
  }

  return slug;
}
