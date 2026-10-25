export function validateGroupName(name: string): string | null {
  return !name.trim() || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)
    ? 'Enter a group name of 1–60 characters without control characters.'
    : null;
}

export function validateItem(item: {
  title: string;
  content: string;
  tool: string;
  kind: string;
  category?: string;
}): string | null {
  if (!['link', 'prompt'].includes(item.kind)) return 'Choose an affiliate link or prompt.';
  if ([item.title, item.content, item.tool].some((value) => typeof value !== 'string'))
    return 'Enter valid text in each field.';
  if (/[\u0000-\u001f\u007f]/.test(item.title + item.tool))
    return 'Names must not contain control characters.';
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
      if (
        !/^https?:\/\//i.test(item.content.trim()) ||
        /\s|[\u0000-\u001f\u007f]/.test(item.content.trim())
      )
        return 'Enter a complete URL without spaces or control characters.';
      if (url.username || url.password)
        return 'Links must not contain embedded usernames or passwords.';
    } catch {
      return 'Enter a complete URL, including https://.';
    }
  }
  return null;
}
