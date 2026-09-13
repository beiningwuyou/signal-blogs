---
version: alpha
name: Amber-Ink-Editorial
description: A refined, high-clarity editorial palette anchored on warm amber voltage
  (brand primary), tactile surface-card paper tones, and deep charcoal ink for uncompromising
  typographic legibility. Designed for information desks, curations, and deep-reading
  interfaces.
colors: null
typography:
  display-xl:
    fontFamily: Newsreader
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 70px
    letterSpacing: -1.5px
  display-xl-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 42px
    letterSpacing: -0.75px
  display-lg:
    fontFamily: Newsreader
    fontSize: 44px
    fontWeight: '400'
    lineHeight: 50px
    letterSpacing: -1px
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: -0.5px
  display-md:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: -0.5px
  display-sm:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.3px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.2px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0px
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 17px
    letterSpacing: 0px
  caption-uppercase:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 15px
    letterSpacing: 1.2px
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0px
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xxs: 0.25rem
  xs: 0.5rem
  sm: 0.75rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  xxl: 3rem
  section: 6rem
---

Brand & Voltage (Core: accent-amber) ---
  primary: "#d97706"                # Amber 600 - Warm, authoritative, luminous accent voltage
  primary-active: "#b45309"         # Amber 700 - Deepened press/active state
  primary-hover: "#f59e0b"          # Amber 500 - Vibrant hover highlight
  primary-light: "#fef3c7"          # Amber 100 - Soft amber tint for active chips & selected badge backgrounds
  primary-soft: "#fffbeb"           # Amber 50 - Whispering amber wash for active card states
  on-primary: "#ffffff"             # Pure crisp white for primary CTAs and contrast badges
  on-primary-dark: "#451a03"        # Deep amber-brown for high-contrast text on light amber pills

  # --- Surfaces (Core: surface-card & warm canvas) ---
  canvas: "#faf8f5"                 # Warm oat cream - Resting workspace backdrop, non-glare for long-reading
  surface: "#f5f2eb"                # Slightly grounded warm floor for app shells and sidebars
  surface-card: "#ffffff"           # Core white card surface - Crisp, tactile paper-lift above the warm canvas
  surface-card-subtle: "#f3efe6"     # Muted secondary card / inset panel for auxiliary content
  surface-card-hover: "#fcfbf9"     # Gentle interactive card lift
  surface-card-active: "#fefbf2"    # Warm amber-tinted active/selected card background
  surface-dark: "#1c1b18"           # Deep ink-ground for code windows, dark terminal/audit cards
  surface-dark-elevated: "#2b2924"  # Elevated dark sub-cards and modals
  hairline: "#e8e3d8"               # 1px hairline border on cards and subtle dividers
  hairline-strong: "#d4cdc0"        # Structural border for focused inputs and selected states

  # --- Typography & Text (Core: ink) ---
  ink: "#171614"                    # Deep rich warm black (off-black) for titles, h1/h2, key headlines
  body-strong: "#2b2926"            # High-emphasis body text and lead paragraphs
  body: "#46443e"                   # Standard running editorial body text (comfortable reading contrast)
  muted: "#757269"                  # Secondary metadata, timestamps, author sources, subtitles
  muted-soft: "#a39f93"             # Captions, hotkey badges, fine-print, line numbers
  on-dark: "#faf8f5"                # Crisp warm-white text over dark card/terminal surfaces
  on-dark-muted: "#a8a49a"          # Secondary labels and comments over dark surfaces

  # --- Functional & Semantic ---
  accent-teal: "#0d9488"            # Teal 600 - Verification markers, live pipeline connection dots
  success: "#16a34a"                # Success green - Validated sources, successful sync
  warning: "#d97706"                # Harmonized with primary amber
  error: "#dc2626"                  # Red 600 - Extraction failure, connection alert

typography:
  display-xl:
    fontFamily: "Copernicus, Tiempos Headline, Georgia, serif"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -1.5px
  display-lg:
    fontFamily: "Copernicus, Tiempos Headline, Georgia, serif"
    fontSize: 44px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -1.0px
  display-md:
    fontFamily: "Copernicus, Tiempos Headline, Georgia, serif"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.5px
  display-sm:
    fontFamily: "Copernicus, Tiempos Headline, Georgia, serif"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.3px
  title-lg:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.2px
  title-md:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 1.2px
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  button:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 18px
    height: 38px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.hairline}"
    padding: 10px 18px
    height: 38px
  card-event:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
    padding: 20px
  card-event-selected:
    backgroundColor: "{colors.surface-card-active}"
    border: "1px solid {colors.primary}"
    rounded: "{rounded.lg}"
    padding: 20px
  badge-amber:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.on-primary-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 3px 10px
  text-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.hairline}"
    padding: 8px 12px