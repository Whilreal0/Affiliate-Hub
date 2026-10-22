import { describe, expect, it } from 'vitest';
import { getAuthOrigins } from '../../convex/authOrigins';

describe('deployment auth origins', () => {
  it('supports an exact HTTPS deployment alongside local development', () => {
    expect(getAuthOrigins('https://app.example', 'http://localhost:5173')).toEqual([
      'https://app.example',
      'http://localhost:5173'
    ]);
  });

  it.each([
    'http://app.example',
    'https://user:password@app.example',
    'https://app.example/callback',
    'https://app.example?redirect=other',
    'https://app.example#fragment',
    'https://*.netlify.app'
  ])('rejects a non-origin or overly broad auth destination: %s', (origin) => {
    expect(() => getAuthOrigins(origin)).toThrow();
  });
});
