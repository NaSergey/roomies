export interface GradientPreset {
  name: string;
  css: string;
}

// Светлые тёплые яркие градиенты — пастельно-сочные, приятные для глаз.
// Тёплый спектр (персик / коралл / роза / золото / манго), высокая светлота,
// чтобы тёмный текст поверх оставался читаемым. Переключаются между карточками.
export const GRADIENT_PRESETS: readonly GradientPreset[] = [
  { name: 'peach',       css: 'linear-gradient(135deg, #ffd9a8 0%, #ff9e7d 100%)' },
  { name: 'coral',       css: 'linear-gradient(135deg, #ffc1a0 0%, #ff8f9a 100%)' },
  { name: 'blossom',     css: 'linear-gradient(150deg, #ffe0ec 0%, #ffb0c4 100%)' },
  { name: 'apricot',     css: 'linear-gradient(135deg, #ffe6b8 0%, #ffaf7e 100%)' },
  { name: 'sunrise',     css: 'linear-gradient(150deg, #ffe9b0 0%, #ffb38a 55%, #ff96b0 100%)' },
  { name: 'melon',       css: 'linear-gradient(140deg, #ffdcc0 0%, #ffae98 100%)' },
  { name: 'lemon-peach', css: 'linear-gradient(135deg, #fff1a8 0%, #ffba8a 100%)' },
  { name: 'flamingo',    css: 'linear-gradient(135deg, #ffd3e0 0%, #ff9fb6 100%)' },
  { name: 'honey',       css: 'linear-gradient(140deg, #ffe9a8 0%, #ffc46a 100%)' },
  { name: 'rose-milk',   css: 'linear-gradient(150deg, #ffe3ea 0%, #ffc0c8 100%)' },
  { name: 'mango',       css: 'linear-gradient(135deg, #ffe07a 0%, #ffab5e 100%)' },
  { name: 'petal',       css: 'linear-gradient(150deg, #ffdfe6 0%, #ffc1a8 100%)' },
  { name: 'cantaloupe',  css: 'linear-gradient(140deg, #ffe3c0 0%, #ffba88 100%)' },
  { name: 'golden',      css: 'linear-gradient(135deg, #ffe78f 0%, #ffc06a 100%)' },
  { name: 'salmon',      css: 'linear-gradient(150deg, #ffd0c0 0%, #ff9f8e 100%)' },
  { name: 'soft-coral',  css: 'linear-gradient(135deg, #ffc9b0 0%, #ff96a0 100%)' },
] as const;

export function getRandomGradientPreset(): GradientPreset {
  return GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)];
}
