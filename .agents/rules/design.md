# NCT 40th Anniversary — Design Rules

## Icon Usage

**DO NOT use system emoji as UI icons.** Emoji rendering is OS-dependent and
produces inconsistent visuals across Windows, macOS, Android, and iOS.

**ALWAYS use Material Symbols Rounded** (loaded via Google Fonts in `layout.tsx`)
for all interface icons:

```tsx
// ✅ Correct
<span className="material-symbols-rounded">home</span>
<span className="material-symbols-rounded">menu_book</span>

// ❌ Wrong — OS-rendered, inconsistent
🏠  📖  ✍️  🔍
```

Emoji MAY still be used in **body copy / prose text** (e.g., section labels like
"✍️ 120 bài viết") where decorative consistency is less critical and they carry
semantic meaning, but **never as clickable icon buttons or nav icons**.

### Icon Library Reference
- Font: `Material Symbols Rounded` — loaded in `src/app/layout.tsx`
- Browse icons: https://fonts.google.com/icons
- Adjust weight/fill via `fontVariationSettings`:
  ```tsx
  // Filled variant
  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}
  ```
