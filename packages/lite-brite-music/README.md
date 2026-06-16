# Lite-Brite Groove (portable)

Self-contained React component: canvas visualization + Web Audio analysis. No Tailwind, Radix, or other UI libraries required—chrome uses inline styles.

## Copy into another project

1. Copy the entire `lite-brite-music` folder into your repo (e.g. `src/vendor/lite-brite-music/` or `packages/lite-brite-music/`).
2. Ensure **React 18+** and **TypeScript** (or rename `.tsx` → `.jsx` and strip types).
3. Import and render:

```tsx
import { LiteBriteMusic } from "./vendor/lite-brite-music";

export default function Page() {
  return (
    <LiteBriteMusic
      title="Lite-Brite Groove"
      documentTitle="Lite-Brite | My Site"
    />
  );
}
```

## Props

| Prop | Description |
|------|-------------|
| `title` | Heading text (default: `"Lite-Brite Groove"`). |
| `documentTitle` | If set, assigns `document.title` while mounted and restores on unmount. |
| `className` | Extra classes on the root `div` (e.g. Tailwind in the host app). |
| `style` | Inline styles merged onto the root `div`. |

## Runtime requirements

- **Secure context** (`https:` or `localhost`) for microphone capture.
- **User gesture** may be required before audio playback/analysis on some browsers (file/mic buttons satisfy this).

## Files

| File | Role |
|------|------|
| `LiteBriteMusic.tsx` | Component + canvas + audio logic |
| `index.ts` | Re-exports `LiteBriteMusic` (default + named), types |

## License

MIT — use freely in your projects.
