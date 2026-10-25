import { describe, it, expect } from 'vitest';
import { validateItem } from './validation';
const link = {
  kind: 'link',
  title: 'Desk lamp',
  content: 'https://example.com/p?affiliate=123',
  tool: 'Store'
};
describe('workspace input validation', () => {
  it('preserves affiliate tracking parameters', () => {
    expect(validateItem(link)).toBeNull();
    expect(link.content).toContain('?affiliate=123');
  });
  it.each([
    'https://user:password@example.com',
    'https:example.com',
    'https://example.com/a b',
    'https://example.com/\npath'
  ])('rejects ambiguous URLs and embedded credentials: %s', (content) => {
    expect(validateItem({ ...link, content })).not.toBeNull();
  });
  it('bounds every text field and rejects invalid kinds and hidden control characters', () => {
    expect(validateItem({ ...link, title: 'x'.repeat(121) })).not.toBeNull();
    expect(validateItem({ ...link, tool: 'x'.repeat(81) })).not.toBeNull();
    expect(validateItem({ ...link, title: 'Hidden\u0000name' })).not.toBeNull();
    expect(validateItem({ ...link, kind: 'other' })).not.toBeNull();
  });
  it.each(['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'example.com'])(
    'rejects unsafe or incomplete links: %s',
    (content) => {
      expect(validateItem({ ...link, content })).not.toBeNull();
    }
  );
  it('allows multiline prompts with product placeholders', () => {
    expect(
      validateItem({
        ...link,
        kind: 'prompt',
        category: 'text-to-image',
        content: 'Show [PRODUCT]\nWarm lighting, no added text.'
      })
    ).toBeNull();
  });
  it('requires categories for prompts while links need none', () => {
    expect(validateItem(link)).toBeNull();
    expect(validateItem({ ...link, kind: 'prompt' })).toContain('category');
  });
  it('rejects empty and excessively long content', () => {
    expect(validateItem({ ...link, title: '  ' })).not.toBeNull();
    expect(validateItem({ ...link, kind: 'prompt', content: 'a'.repeat(12001) })).not.toBeNull();
  });
});
