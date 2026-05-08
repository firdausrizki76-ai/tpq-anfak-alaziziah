---
name: Arabesque Scholar
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#404944'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#003430'
  on-tertiary: '#ffffff'
  tertiary-container: '#004d47'
  on-tertiary-container: '#6ac0b6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#9cf2e8'
  tertiary-fixed-dim: '#80d5cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#00504a'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  display-lg:
    fontFamily: notoSerif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: notoSerif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  title-lg:
    fontFamily: lexend
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: lexend
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: lexend
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is rooted in the "Modern Arabesque" aesthetic, merging traditional Islamic geometry with contemporary digital minimalism. The personality is disciplined yet warm, catering to students who seek a focused academic environment that honors their spiritual identity.

The visual style leans into **Corporate / Modern** with subtle **Glassmorphism** overlays to suggest light and transparency. Key characteristics include:
- **Geometry as Structure:** Using eight-pointed stars and tessellations as subtle background textures or container masks.
- **Architectural Motifs:** Implementing the "Sahn" (courtyard) concept through generous whitespace and "Mihrab" (arched) shapes in navigation and framing.
- **High-Fidelity Tactility:** Utilizing soft shadows and metallic accents to evoke a sense of premium quality and heritage.

## Colors

The palette is anchored by **Deep Emerald Green**, representing growth and tradition, and **Gold**, symbolizing excellence and light. 

- **Primary Emerald (#064E3B):** Used for primary actions, navigation backgrounds, and authoritative text.
- **Secondary Gold (#D4AF37):** Reserved for highlights, progress indicators, and decorative accents.
- **Background Cream (#FDFBF7):** A soft, eye-straining-reductive base that feels more organic and warmer than pure white.
- **Success/Warning/Error:** Utilize desaturated versions of standard semantical colors to maintain the sophisticated, muted tone of the portal.

## Typography

The typography strategy balances the classic authority of calligraphic traditions with the readability required for educational portals.

- **Headlines (notoSerif):** Chosen for its elegant, high-contrast strokes that mirror traditional reed-pen calligraphy. It should be used for page titles and major section headers.
- **Body & Labels (lexend):** Designed specifically for readability and focus, this sans-serif keeps the interface feeling modern and accessible. Its open counters prevent fatigue during long study sessions.
- **Stylistic Note:** Headings should occasionally use Title Case for a more formal, "published" feel.

## Layout & Spacing

The layout follows a **Fixed Grid** system for desktop to maintain a composed, book-like feeling, transitioning to a fluid model for mobile.

- **Rhythm:** A 4px baseline grid ensures vertical harmony.
- **Margins:** Generous outer margins (40px+) mimic the wide margins found in illuminated manuscripts, providing "breathing room" for the content.
- **Grid:** A 12-column grid with 24px gutters. Content cards typically span 4 columns (for stats) or 8 columns (for main feeds).

## Elevation & Depth

This design system avoids harsh dropshadows in favor of **Ambient, Tinted Shadows**.

- **Shadow Character:** Shadows use the Primary Emerald color at extremely low opacity (5-8%) rather than pure black. This creates a "glow" effect that feels spiritual and light.
- **Layering:** 
    - **Level 0 (Surface):** Cream background.
    - **Level 1 (Cards):** White background with a 1px border in a pale emerald tint and a soft, wide-spread shadow.
    - **Level 2 (Modals/Popovers):** Higher elevation with a subtle "Glassmorphism" backdrop blur (12px) to keep the user grounded in the portal's context.

## Shapes

The shape language is the primary vehicle for the "Arabesque" theme.

- **Primary Radius:** A consistent 0.5rem (8px) for standard UI components.
- **The Arched Motif:** Specific containers (like the side navigation or featured hero images) should employ a "Mihrab" top-radius—where the top-left and top-right corners have a significantly larger, arched radius (e.g., 100px) while the bottom remains standard.
- **Geometric Accents:** Use CSS masks or SVGs of 8-pointed stars (Khatim) for small decorative elements like bullet points or avatar frames.

## Components

- **Buttons:** Primary buttons are Solid Emerald with Gold text or white text. They should feature a subtle gold 2px bottom border to give a "raised" effect.
- **Input Fields:** Use a "filled" style with the `primary-container` color. The active state should change the border to Gold and the background to white.
- **Cards:** White surfaces with a very thin #E5E7EB border. The top edge of a card may feature a 4px Gold stripe for "Featured" content.
- **Chips/Tags:** Pill-shaped with a soft emerald background (`primary-container`) and dark emerald text.
- **Progress Bars:** For course completion, use a dual-tone bar: a pale gold track with a deep emerald progress fill.
- **Navigation:** The sidebar should be treated as a distinct vertical "monolith" in Deep Emerald, with active states indicated by a gold arched highlight on the right edge.
- **Iconography:** Use line-icons with a consistent 2px stroke weight. Incorporate "geometric-style" icons that avoid overly rounded "bubbly" aesthetics.