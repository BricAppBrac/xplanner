export function slugToLabel(slug) {
  if (!slug) return '';
  const label = slug.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
