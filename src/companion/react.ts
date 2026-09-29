import { icon } from '../icons';

/**
 * Tap reactions. The mood decides how much fuss the companion makes:
 *   play:  hop + floating heart (home, breaks)
 *   focus: a quick, quiet wave; rate-limited so it can't become a fidget toy
 *   sleep: stirs in its nap, then settles
 */
export type Mood = 'play' | 'focus' | 'sleep';

const COOLDOWN: Record<Mood, number> = { play: 500, focus: 4000, sleep: 2500 };
const CLASS: Record<Mood, string> = { play: 'petted', focus: 'react-wave', sleep: 'react-stir' };

/** Wrap the companion in a button and react to taps. Returns the button to place in the page. */
export function makePettable(
  art: SVGSVGElement,
  opts: { label: string; mood: () => Mood; onReact?: () => void },
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pet-btn';
  btn.setAttribute('aria-label', opts.label);
  btn.append(art);
  let last = 0;

  btn.addEventListener('click', () => {
    const mood = opts.mood();
    const now = Date.now();
    if (now - last < COOLDOWN[mood]) return;
    last = now;
    opts.onReact?.();
    for (const c of Object.values(CLASS)) art.classList.remove(c);
    void art.getBoundingClientRect(); // restart the animation
    art.classList.add(CLASS[mood]);
    if (mood === 'play') {
      const heart = icon('heart', 'float-heart');
      heart.style.left = `${40 + Math.random() * 20}%`;
      btn.append(heart);
      window.setTimeout(() => heart.remove(), 1200);
    }
    try {
      navigator.vibrate?.(mood === 'play' ? 12 : 6);
    } catch {
      /* unsupported */
    }
  });
  return btn;
}
