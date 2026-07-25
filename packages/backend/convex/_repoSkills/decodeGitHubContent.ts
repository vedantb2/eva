/**
 * Decode GitHub Contents API base64 payloads without Node `Buffer`
 * (Convex isolate / browser-safe).
 */
export function decodeGitHubContent(content: string): string {
  const binary = atob(content.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}
