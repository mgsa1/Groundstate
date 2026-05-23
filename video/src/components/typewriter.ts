// Reveal `text` character-by-character. Returns the substring visible at `frame`.
export function typewriter(text: string, frame: number, startFrame: number, charsPerFrame = 1.6) {
  if (frame <= startFrame) return "";
  const cursor = Math.floor((frame - startFrame) * charsPerFrame);
  return text.slice(0, Math.min(cursor, text.length));
}
