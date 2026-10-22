import type { Item } from './types';
// Examples are deliberately identified as samples. Affiliate URLs are supplied by the user.
export const demoItems: Item[] = [
  {
    _id: 'sample-1',
    kind: 'prompt',
    title: 'The everyday essential',
    tool: 'Any image model',
    category: 'text-to-image',
    favorite: true,
    createdAt: 6,
    content:
      'Create a photorealistic lifestyle product photo of [PRODUCT] on a warm oak table beside a window. Soft morning light, neutral linen background, subtle natural shadows. Keep the product shape and branding accurate. Editorial photography, 50mm lens, shallow depth of field, vertical 4:5 composition. No added text or watermarks.'
  },
  {
    _id: 'sample-2',
    kind: 'prompt',
    title: 'A little luxury',
    tool: 'Any image model',
    category: 'text-to-image',
    favorite: false,
    createdAt: 5,
    content:
      'A premium studio photograph of [PRODUCT] on a matte stone pedestal. Warm cream backdrop, directional softbox lighting, gentle shadow falloff, generous negative space. Preserve the exact packaging details. Minimal editorial styling, crisp material textures, vertical 4:5 aspect ratio. No extra text.'
  },
  {
    _id: 'sample-3',
    kind: 'prompt',
    title: 'The slow reveal',
    tool: 'Any video model',
    category: 'image-to-video',
    favorite: true,
    createdAt: 4,
    content:
      'Animate the supplied product photo into a 6-second product reveal. Begin with a close-up and slowly dolly backward to reveal the full product. Subtle light movement across the surface. Keep the product, labels, background and proportions consistent with the source image. Smooth camera motion, no warping, no new objects, no added text. Vertical 9:16.'
  },
  {
    _id: 'sample-4',
    kind: 'prompt',
    title: 'Made for the morning',
    tool: 'Any video model',
    category: 'image-to-video',
    favorite: false,
    createdAt: 3,
    content:
      'Use the reference image as the first frame. Create a 5-second lifestyle clip with a gentle left-to-right camera slide and subtle natural movement in the background. Morning light, calm mood, realistic depth. Keep [PRODUCT] stable and identical to the reference. No label changes, no morphing, no additional hands. Vertical 9:16.'
  },
  {
    _id: 'sample-5',
    kind: 'prompt',
    title: 'Details worth a closer look',
    tool: 'Any image model',
    category: 'text-to-image',
    favorite: false,
    createdAt: 2,
    content:
      'Create a detailed macro product photograph of [PRODUCT], highlighting [KEY FEATURE]. Clean muted sage background, soft side lighting, realistic materials and accurate proportions. Professional commercial photography with a subtle depth of field. Vertical 4:5 crop, no added text.'
  },
  {
    _id: 'sample-6',
    kind: 'prompt',
    title: 'The cinematic orbit',
    tool: 'Any video model',
    category: 'image-to-video',
    favorite: false,
    createdAt: 1,
    content:
      'Animate this image with a very slow 15-degree camera orbit around [PRODUCT] over 6 seconds. Maintain the source composition and lighting. Product stays centered, stable, and unchanged. Realistic parallax, smooth motion, consistent label details. No cuts or transitions, no new objects. Vertical 9:16.'
  }
];
