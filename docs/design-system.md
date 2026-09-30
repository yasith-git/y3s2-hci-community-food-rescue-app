# Design System Guidelines & Architecture

> **Status:** Production-Ready Shared Foundation (Phase 1)
> **Branch Source:** `dev`

---

## 1. Product Design Philosophy

The Community Food Rescue mobile application is built around a **human-centered, environmental, and Apple-inspired modern glass design language**. 

### Core Principles
- **Unifying Shared Foundation:** All user roles (Donors, Volunteers, Coordinators) share ONE cohesive visual layer.
- **Accessible Glassmorphism:** Translucent materials and subtle highlights reinforce spatial depth without compromising contrast and readability.
- **Triple-Encoded Status:** Statuses are never conveyed by color alone; every status combines **Icon + Text + Semantic Color**.
- **Tactile & Fluid Micro-Interactions:** Buttons and interactive cards leverage spring physics and purposeful haptics.
- **Strict Token Source of Truth:** Zero arbitrary hex colors, padding numbers, or font sizes.

---

## 2. Color System Tokens

Defined centrally in `src/design-system/colors.ts`:

| Token Category | Token Key | Hex Value / RGBA | Usage |
|---|---|---|---|
| **Background** | `background.app` | `#F7F8F5` | Default canvas background |
| | `background.warm` | `#FAF8F3` | Warm card surface |
| | `background.pure` | `#FFFFFF` | Pure white contrast layers |
| **Brand Hierarchy** | `brand[900]` | `#0B3D35` | Deep forest brand ink / headers |
| | `brand[700]` | `#115B4E` | Medium brand shade |
| | `brand[500]` / `brand.primary` | `#238471` | Primary CTA, active tabs |
| | `brand[100]` | `#DDF2EB` | Soft mint highlights, icon backdrops |
| **Typography Ink** | `text.primary` | `#173D39` | High-contrast body & titles |
| | `text.secondary` | `#4F625B` | Subheadings & supporting text |
| | `text.muted` | `#718079` | Captions, unselected tabs |
| | `text.disabled` | `#A1AAA6` | Disabled states & placeholders |
| **Accents** | `accent.warm` | `#F4A261` | Warm community accent |
| | `accent.softPeach` | `#F8D9C4` | Ambient warm background glow |
| | `accent.softMint` | `#E3F0E7` | Ambient mint background glow |
| **Semantic** | `status.success` | `#238471` | Available / Delivered / Success |
| | `status.warning` | `#D89032` | Reserved / Pickup Soon / Warnings |
| | `status.error` | `#C84C4C` | Expired / Issues / Destructive CTAs |
| | `status.info` | `#477E9F` | Assigned / In Transit / Info |

---

## 3. Glass Material System

Glass surfaces are abstracted exclusively through `GlassSurface` (`src/components/ui/GlassSurface.tsx`) and configured via `src/design-system/glass.ts`.

### Multi-Platform Rendering Strategy
1. **iOS Platform:** Renders hardware-accelerated `expo-blur` (`BlurView`) with dynamic intensity (15–45) and a linear gradient top-highlight.
2. **Android Platform:** Uses a high-performance frosted translucent background (`androidFallbackBg`) with matched border opacity and elevation, avoiding expensive GPU overdraw.
3. **Web Platform:** Clean translucent CSS-friendly fallback.

### Standard Glass Variants
- `glass.subtle` (Header, Input, Chip backgrounds)
- `glass.standard` (Cards, general containers)
- `glass.elevated` (High-impact cards, highlighted modals)
- `glass.navigation` (Floating bottom navigation bar)
- `glass.buttonPrimary`, `glass.buttonSecondary`, `glass.buttonDanger` (Buttons)
- `glass.modal` (Full-screen overlay dialogs)

---

## 4. Typography Hierarchy

Tokens defined in `src/design-system/typography.ts`:

- `displayLarge` (34px, 800 weight)
- `displayMedium` (28px, 700 weight)
- `headingLarge` (24px, 700 weight)
- `headingMedium` (20px, 600 weight)
- `headingSmall` (18px, 600 weight)
- `titleLarge` (17px, 600 weight)
- `titleMedium` (15px, 600 weight)
- `titleSmall` (13px, 600 weight)
- `bodyLarge` (16px, 400 weight)
- `bodyMedium` (14px, 400 weight)
- `bodySmall` (12px, 400 weight)
- `labelLarge` (15px, 600 weight)
- `labelMedium` (13px, 500 weight)
- `labelSmall` (11px, 500 weight)
- `caption` (12px, 400 weight)

---

## 5. Spacing & Border Radius Scales

- **Spacing (`src/design-system/spacing.ts`):** `none` (0), `xxs` (2), `xs` (4), `sm` (8), `md` (12), `lg` (16), `xl` (20), `2xl` (24), `3xl` (32), `4xl` (40), `5xl` (48), `6xl` (64).
  - Screen standard horizontal padding: `20px` (`spacing.screenHorizontal`).
- **Radius (`src/design-system/radius.ts`):** `none` (0), `xs` (4), `sm` (8), `md` (12), `lg` (16), `xl` (20), `2xl` (24), `3xl` (32), `pill` / `round` (9999).

---

## 6. Shared UI Components (`src/components/ui/`)

All future screens across all branches must build with these primitives:

1. `GlassSurface` - Core blur/glass abstraction with Android fallback.
2. `GlassButton` - Primary, secondary, tertiary, danger, and success buttons with haptics & loading state.
3. `GlassIconButton` - Circular/pill icon action buttons.
4. `GlassCard` - Standard, elevated, compact, and interactive pressable cards.
5. `GlassHeader` - Clean top navigation header with back button and action slots.
6. `GlassBottomBar` - Shared floating bottom navigation container.
7. `GlassChip` - Multi-select and single-select filter chips.
8. `GlassBadge` - Informational and numerical badges.
9. `PrimaryTextInput` - Focus-animated form inputs with error and helper text.
10. `SearchInput` - Search bar with instant clear button.
11. `StatusBadge` - Triple-encoded status component (`available`, `reserved`, `assigned`, `in_transit`, etc.).
12. `Avatar` - User/donor avatar with fallback initials and status dot.
13. `Divider` - Horizontal/vertical subtle separation line.
14. `SectionHeader` - Standardized header with title, subtitle, and action slot.
15. `ProgressBar` - Linear progress tracker.
16. `ProgressStepper` - Multi-step process tracker for rescues.
17. `Skeleton` - Smooth shimmer placeholder for loading states.
18. `LoadingOverlay` - Glass modal spinner for async operations.
19. `EmptyState`, `ErrorState`, `SuccessState` - Standardized state feedback cards.
20. `AppBackground` - Atmospheric gradient canvas.
21. `ScreenContainer` - Full screen wrapper managing safe areas and scroll.
22. `AnimatedPressable` - Base touchable with spring feedback.

---

## 7. Mandatory Rules for Feature Developers

> [!IMPORTANT]
> **STRICT SAME-THEME GUARANTEE:**
> 1. **DO NOT** create ad-hoc colors, hardcoded hex values, or random font sizes in feature screens.
> 2. **DO NOT** call `BlurView` or custom glass styling directly in screen files.
> 3. **DO NOT** install alternative button, input, or icon libraries. All icons use `@expo/vector-icons` (`Ionicons`).
> 4. If a new primitive is required, add it to `src/design-system/` or `src/components/ui/` first.
