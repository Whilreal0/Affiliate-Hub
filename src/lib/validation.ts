export function validateItem(item: {
  title: string;
  content: string;
  tool: string;
  kind: string;
  category?: string;
}): string | null {
  if (!item.title.trim() || item.title.length > 120) return 'Enter a title of 1–120 characters.';
  if (!item.content.trim() || item.content.length > 12000)
    return 'Enter content of 1–12,000 characters.';
  if (item.tool.length > 80) return 'Tool name must be 80 characters or fewer.';
  if (item.kind === 'prompt' && !['text-to-image', 'image-to-video'].includes(item.category ?? ''))
    return 'Choose an image or video category for this prompt.';
  if (item.kind === 'link') {
    try {
      const url = new URL(item.content.trim());
      if (!['https:', 'http:'].includes(url.protocol)) return 'Use an http or https link.';
    } catch {
      return 'Enter a complete URL, including https://.';
    }
  }
  return null;
}
