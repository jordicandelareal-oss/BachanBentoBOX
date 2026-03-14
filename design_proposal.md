# Visual Identity & UX/UI Overhaul: "Bachan Bento Box"

## 1. Brand Identity & Color Palette
To ensure a professional and cohesive feel, we adopt a high-end corporate palette suitable for culinary environments.

| Color | Hex | Role |
| :--- | :--- | :--- |
| **Navy Blue** | `#1B263B` | Primary Brand Color (Trust, depth) |
| **Cream White** | `#F8F9FA` | Background (Cleanliness, clarity) |
| **Coral Red** | `#FF6B6B` | Accent & Alerts (Energy, Japanese influence) |
| **Slate Gray** | `#415A77` | Secondary text |

## 2. Cinematic Intro Script (5 Seconds)
A clean, impactful sequence that establishes the brand without noise.

| Time | Visual | Audio |
| :--- | :--- | :--- |
| **0.0s - 1.0s** | Deep Navy Background. Soft fade-in of Nana. | Zen Silence / Soft Wind chime |
| **1.0s - 2.5s** | Nana performs a respectful bow (reverencia). | "nana-voice.mp3" (Greeting) triggers |
| **2.5s - 4.0s** | Nana fades out as the Official Logo scales up smoothly. | Subtle "whoosh" transition |
| **4.0s - 5.0s** | Logo glows slightly. Screen fades to Cream White. | Transition to Dashboard |

## 3. Dashboard UI Refinements (Wireframe)

### A. Rentability Card
- **Typography**: `Poppins-Bold` for values, `Poppins-Medium` for labels.
- **Visuals**: Use a subtle glassmorphism effect (semi-transparent white over navy gradients).
- **Icons**: Minimalist line art with Coral Red highlights.

### B. Action Buttons ("Gestionar Insumos" / "Buscar Receta")
- **Style**: Solid Navy Blue containers with high contrast Cream White text.
- **Interactions**: 
  - `ScaleDown` (0.98) on press.
  - Subtle `Inner Shadow` or `Glow` effect to indicate activity.

### C. Nana's Feedback Bubbles
- Instead of a static image, Nana will appear in a small circular avatar at the bottom left with a speech bubble for context-aware tips (e.g., "¡Oye! El precio del Atún ha subido un 5%").

## 4. Implementation Steps
1.  **Theme Update**: Centralize new colors in `theme.js`.
2.  **Typography**: Integrate Google Fonts (Poppins/Montserrat).
3.  **Intro Logic**: Update `SplashScreen.js` timing and video source (once provided) or simulate with animations.
4.  **Component Polishing**: Refactor `App.js` styles for better contrast and geometric precision.
