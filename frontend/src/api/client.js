async function getJson(path) {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Заявката към ${path} не успя (HTTP ${res.status}).`);
  return res.json();
}

/** File name from a Content-Disposition header (the UTF-8 `filename*` wins). */
function filenameOf(header = '') {
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      // fall through to the plain name
    }
  }
  return /filename="([^"]+)"/i.exec(header)?.[1] ?? null;
}

/** Downloads a file from the API: { blob, filename }. Throws with the server's message on failure. */
export async function downloadFile(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Файлът не може да бъде изтеглен (HTTP ${res.status}).`);
  }
  return { blob: await res.blob(), filename: filenameOf(res.headers?.get('Content-Disposition') ?? '') };
}

/** Hands a blob to the browser as a download. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const api = {
  kindergartens: () => getJson('/api/kindergartens'),
  regions: () => getJson('/api/regions'),
  meta: () => getJson('/api/meta'),
};
