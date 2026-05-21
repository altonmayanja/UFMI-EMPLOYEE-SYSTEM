---
name: UFMI Enterprise
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#454651'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#767682'
  outline-variant: '#c6c5d3'
  surface-tint: '#4959a6'
  primary: '#000c46'
  on-primary: '#ffffff'
  primary-container: '#0b1f6d'
  on-primary-container: '#7b8adc'
  inverse-primary: '#b9c3ff'
  secondary: '#b02e10'
  on-secondary: '#ffffff'
  secondary-container: '#fd6442'
  on-secondary-container: '#5f0e00'
  tertiary: '#1d1200'
  on-tertiary: '#ffffff'
  tertiary-container: '#372600'
  on-tertiary-container: '#b98700'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001258'
  on-primary-fixed-variant: '#30408c'
  secondary-fixed: '#ffdad2'
  secondary-fixed-dim: '#ffb4a3'
  on-secondary-fixed: '#3d0600'
  on-secondary-fixed-variant: '#8b1a00'
  tertiary-fixed: '#ffdea3'
  tertiary-fixed-dim: '#fdbc13'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The brand personality for the design system is **authoritative, prestigious, and operationally precise**. It serves the Uganda Film Movie Industry by balancing the creative vibrancy of cinema with the rigorous structure required for enterprise operations. The UI must evoke a sense of security and institutional trust, positioning the product as the definitive backbone of the local film industry.

The design style is **Corporate / Modern** with subtle **Cinematic** influences. This is achieved through a high-contrast palette, generous use of whitespace to separate complex data, and a focus on premium finishing—such as fine borders and soft, atmospheric depth. The visual language avoids decorative clutter, ensuring that every element serves a functional purpose while maintaining an elegant, high-end aesthetic suitable for international industry standards.

## Colors

The color palette is anchored by the **Primary Blue**, representing stability and institutional authority. The **Accent Red/Orange** and **Gold Accent** are used sparingly for high-priority actions, critical status updates, and decorative "Director's Cut" highlights, bringing a touch of cinematic energy to the enterprise environment.

- **Primary Blue (#0B1F6D):** Used for primary navigation, main buttons, and structural branding.
- **Secondary Red/Orange (#D94B2B):** Reserved for urgent alerts, error states, and high-conversion calls to action.
- **Gold Accent (#F4B400):** Utilized for "Premium" status indicators, star ratings, and subtle "Editor's Choice" highlights.
- **Neutrals:** The background remains a cool **Light Gray (#F5F7FA)** to reduce eye strain, while text utilizes **Dark Text (#111827)** for maximum legibility in data-heavy views.

## Typography

This design system utilizes **Inter** exclusively to ensure maximum legibility across administrative dashboards and mobile interfaces. The typographic scale is optimized for information density, using weight and letter spacing rather than excessive size to create hierarchy.

Headlines use a tighter letter spacing and heavier weights to mimic the bold, impactful nature of film titles. Body copy is set with generous line heights to ensure readability in long-form reports or legal contracts. Label styles utilize semi-bold weights and occasionally uppercase styling for clear categorization in data tables and metadata fields.

## Layout & Spacing

The layout follows a **Fluid Grid** system based on an 8px base unit. For wide-screen dashboards, a 12-column grid is used with 24px gutters to allow for complex data visualization. On mobile, the system collapses to a single-column view with 16px side margins.

Spacing is designed to be "airy yet efficient." Components within a group (like form fields) use `stack-sm` (8px), while distinct sections on a page use `stack-lg` (24px). This hierarchy of proximity ensures that related data points are visually grouped, reducing the cognitive load on users managing large volumes of industry data.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**. The design system avoids harsh, heavy shadows in favor of subtle, extra-diffused elevations that make elements appear to float slightly above the light gray background.

- **Level 0 (Base):** Background (#F5F7FA) used for the main canvas.
- **Level 1 (Surface):** White (#FFFFFF) containers used for cards and table rows, featuring a 1px border (#E5E7EB) and no shadow.
- **Level 2 (Floating):** Used for dropdowns, modals, and active tooltips. These utilize a soft shadow with a 12px blur and 4% opacity of the Primary Blue to create a "secure" and "premium" depth effect.
- **Overlays:** Full-screen modals use a semi-transparent Primary Blue tint (#0B1F6D at 40% opacity) to focus the user's attention while maintaining the brand's visual presence.

## Shapes

The design system employs a **Rounded** shape language (0.5rem base) to soften the professional environment and make the interface feel more modern and approachable. 

- **Small Components:** Checkboxes and radio buttons use a 4px (Soft) radius.
- **Standard Components:** Buttons, input fields, and status chips use a 0.5rem (8px) radius.
- **Large Components:** Cards and dashboard modules use a 1rem (16px) radius to clearly define major content areas.
- **Pill Shapes:** Reserved exclusively for status indicators (e.g., "In Production," "Approved") to distinguish them from interactive buttons.

## Components

### Buttons
Primary buttons use the Primary Blue with white text. Hover states shift to a slightly darker shade. Secondary buttons use a Primary Blue outline with a transparent background. Action buttons for "Live" or "Urgent" tasks may utilize the Accent Red/Orange.

### Data Tables
Tables are the heart of the system. They feature a clean, borderless look on the interior, using subtle row-striping for readability. Headers are sticky, utilizing the `label-lg` typography style in Primary Blue.

### Status Indicators
Small, pill-shaped tags used for workflow tracking. They use high-contrast text on a very light version of the status color (e.g., Gold text on light gold background for "Pending").

### Secure Forms
Input fields feature a 1px neutral border that transitions to a 2px Primary Blue border on focus. Error states are clearly marked with the Accent Red/Orange and include a descriptive icon for accessibility. Labels are always positioned above the field for clarity.

### Dashboards & Cards
Information is encapsulated in Level 1 Surface cards. Each card has a consistent 24px internal padding. Dashboard "Quick Stats" use the Gold or Red accents for numerical data to provide an immediate "at-a-glance" status of industry health.