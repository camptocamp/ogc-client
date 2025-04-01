/**
 * Returns the parent path from a URL based on a version pattern (x.y.z).
 */
export function getParentPath(url: string): string | null {
  const urlObj = new URL(url, window.location.toString());
  const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
  if (pathParts.length <= 2) {
    return null;
  }
  urlObj.pathname = pathParts.slice(0, -1).join('/');
  return urlObj.toString();
}
