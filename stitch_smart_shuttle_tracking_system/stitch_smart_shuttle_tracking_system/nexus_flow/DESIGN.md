```markdown
# Design System Document: Kinetic Fluidity

## 1. Overview & Creative North Star
This design system is built to transcend the utility of transit. While the core functionality is a Smart Shuttle service, the visual language must feel like a premium concierge experience. Our Creative North Star is **"Kinetic Fluidity."** 

We move away from the rigid, boxed-in layouts of traditional utility apps. Instead, we embrace an editorial approach: intentional asymmetry, generous breathing room, and a sense of motion even in static states. By utilizing overlapping elements and high-contrast typography scales, we create a UI that feels "tech-forward" yet sophisticated—less like a spreadsheet of times and more like a curated journey.

## 2. Colors & Tonal Depth
The color palette leverages a Deep Blue for authority, Emerald for success/movement, and Orange for urgent wayfinding. However, the secret to a premium feel lies in the **Neutrals and Surfaces.**

### The "No-Line" Rule
Standard UI relies on 1px borders to separate content. In this design system, **solid borders are prohibited.** Sectioning must be achieved through:
- **Background Shifts:** Placing a `surface-container-low` card on a `surface` background.
- **Tonal Transitions:** Using subtle differences between `surface-container-lowest` and `surface-container-high` to define boundaries.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials.
- **Base Layer:** `surface` (#101415 in Dark Mode).
- **Secondary Sectioning:** `surface-container-low` (#191c1e).
- **Interactive Cards:** `surface-container-high` (#272a2c).
- **Floating Elements:** Use `surface-bright` with 80% opacity and a 20px backdrop blur.

### The "Glass & Gradient" Rule
To add "soul" to the tech-forward vibe, use **Signature Textures**:
- **CTAs:** Do not use flat hex codes. Apply a subtle linear gradient from `primary` (#b4c5ff) to `primary-container` (#2563eb) at a 135-degree angle.
- **Glassmorphism:** Navigation bars and floating action cards must use a semi-transparent `surface_variant` with a high `backdrop-filter: blur(16px)`. This integrates the UI into the map or background content rather than "pasting" it on top.

## 3. Typography
We utilize a duo-font strategy to balance editorial flair with functional precision.

- **Display & Headlines (Plus Jakarta Sans):** These are our "Brand Voice." Use `display-lg` and `headline-md` for ETAs and welcome messages. The wide apertures and modern geometric shapes of Plus Jakarta Sans provide a premium, "new-tech" feel.
- **Body & Labels (Inter):** Inter is used for all data-heavy points—shuttle numbers, addresses, and timestamps. It is engineered for legibility at small sizes (`body-sm` and `label-md`).

**Hierarchy Tip:** Use `title-lg` in `primary` color for destination names to draw the eye immediately, while using `on-surface-variant` for secondary metadata like "5 mins away."

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than structural lines.

- **The Layering Principle:** To lift a card, do not reach for a shadow first. Instead, move it one step up the container scale (e.g., a `surface-container-highest` card sitting on a `surface-container-low` background).
- **Ambient Shadows:** Shadows are reserved for "Floating" elements only (e.g., the 'Book Now' button). Shadows must be:
    - **Color:** A tinted version of the background (e.g., a deep indigo tint).
    - **Specs:** Blur: 32px, Opacity: 8%, Y-Offset: 8px. Avoid harsh black shadows.
- **The "Ghost Border" Fallback:** If high-contrast environments require a border for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.

## 5. Components

### Buttons
- **Primary:** High-rounded corners (`xl`: 3rem). Uses the Primary-to-Primary-Container gradient. Text is `on-primary`.
- **Secondary:** `surface-container-highest` background with `on-surface` text. No border.
- **Interaction:** On press, scale the button down to 96% to simulate physical depth.

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines. 
- **Style:** Use a vertical 16px or 24px gap between items. For lists, use a slight background shift on alternate items or simply use `title-sm` typography to anchor the start of each new data point.
- **Radius:** All cards must use `md` (1.5rem) or `lg` (2rem) corner radius to maintain the "soft tech" aesthetic.

### Input Fields
- **Container:** Use `surface-container-low`. 
- **States:** On focus, the container shifts to `surface-container-high` and a "Ghost Border" of `primary` appears at 20% opacity.
- **Labels:** Use `label-md` floating above the input, never inside the placeholder area.

### Specialized Shuttle Components
- **Live ETA Chip:** A `secondary-container` capsule with `on-secondary-container` text. Use a pulsing animation on a 4px dot next to the time to indicate "Live" data.
- **Route Timeline:** A 4px thick vertical line using `surface-variant`. Active segments use a gradient of `primary`. Stop points are circles with `sm` (0.5rem) radius.

## 6. Do's and Don'ts

### Do
- **Use Asymmetry:** Place the Headline on the left and a secondary action/image slightly offset to the right to create an editorial feel.
- **Embrace White Space:** If a screen feels "empty," do not add more boxes. Increase the font size of the primary data point.
- **Smooth Transitions:** Every state change (hover, active, loading) must have at least a 300ms cubic-bezier transition.

### Don't
- **No Sharp Corners:** Never use a radius below 8px. We are building for comfort and fluid movement.
- **No Pure Black:** Even in Dark Theme, use `surface` (#101415). Pure #000000 kills the depth of glassmorphism effects.
- **No Centered Text Blocks:** Avoid centering long strings of text. Keep it left-aligned (editorial standard) or right-aligned for specific data values.

---
*Note to Junior Designers: This system is a living framework. When in doubt, prioritize the "Kinetic Fluidity" North Star. If it feels static, heavy, or "boxed-in," simplify the layers and increase the tonal contrast.*```