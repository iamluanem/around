/**
 * Photos are served from /public/images (fetched once with `npm run images:fetch`),
 * so the demo works offline. If a local file is missing, <Photo> falls back to Unsplash.
 */
export const photo = (id: string) => `/images/${id}.jpg`;

export const remotePhoto = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

/** Local path → Unsplash URL (or null when the src is not one of ours). */
export function remoteFallback(src: string): string | null {
  const m = src.match(/^\/images\/(photo-[\w-]+)\.jpg$/);
  return m ? remotePhoto(m[1]) : null;
}
