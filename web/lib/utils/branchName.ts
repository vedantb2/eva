export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function createFeatureBranchName(featureTitle: string): string {
  const slug = slugify(featureTitle);
  return `conductor/feature-${slug}`;
}

export function createTaskBranchName(
  featureTitle: string,
  taskNumber: number
): string {
  const slug = slugify(featureTitle);
  return `conductor/feature-${slug}-${taskNumber}`;
}
