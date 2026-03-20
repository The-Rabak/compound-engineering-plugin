---
name: frontend-design
description: >-
  This skill should be used when creating distinctive, production-grade frontend interfaces with high design quality. It
  applies when the user asks to build web components, pages, or applications. Generates creative, polished code that
  avoids generic AI aesthetics.
---

## Goal
Produce distinctive, production-grade frontend work that feels intentionally designed, not generic.

## Use this skill when
- Building a web component, page, or application UI.
- The work needs strong aesthetic direction, polished interaction design, and high implementation quality.
- The request benefits from creative visual differentiation.

## Do not use this skill when
- A generic starter UI is acceptable.
- You are about to default to common AI aesthetics or safe-but-boring patterns.
- You plan to ignore the framework and styling conventions already present in the project.

## Operating rules
- Understand purpose, audience, constraints, and the one memorable differentiator before coding.
- Pick a bold aesthetic direction and execute it consistently.
- Match implementation complexity to the aesthetic vision.
- Follow the project's existing framework, component, and CSS conventions.
- Use design tokens through CSS custom properties.
- Use mobile-first responsive design with `min-width` breakpoints at 640, 768, 1024, and 1280 when appropriate.
- Support dark mode and respect `prefers-reduced-motion`.
- Meet WCAG AA contrast and accessibility expectations.
- Avoid generic fonts such as Inter, Roboto, Arial, and default system stacks when the design calls for something distinctive.
- Avoid cliched purple-gradient-on-white, cookie-cutter layouts, and repetitive component patterns.

## Procedure / Reference
### Design the concept first
Decide:
- Purpose: what problem does the interface solve?
- Tone: brutally minimal, maximalist chaos, retro-futuristic, organic, luxury, playful, editorial, brutalist, art deco, soft pastel, industrial, or another clear direction.
- Constraints: framework, performance, and accessibility requirements.
- Differentiation: what single thing will users remember?

### Follow framework-specific patterns
React / Next.js:
- Functional components with hooks
- CSS Modules, Tailwind CSS, or styled-components to match the project
- `motion` from Framer Motion when available
- Component composition over inheritance

Vue 3 / Nuxt 3:
- Composition API with `<script setup>`
- Scoped styles with `<style scoped>`
- Composables for shared logic
- `defineProps` and `defineEmits`

Angular:
- Standalone components
- Signal-based reactivity when supported
- OnPush change detection
- Angular CDK for accessible primitives

Svelte / SvelteKit:
- Reactive declarations with `$:`
- Svelte transitions and animations
- Slots for composition

Vanilla / framework-agnostic:
- Web Components when encapsulation matters
- CSS custom properties for theming
- Progressive enhancement

### Apply general implementation conventions
- Use `rem` for sizing and `px` only for borders and fine details.
- Use semantic HTML.
- Use Grid for page layout and Flexbox for component alignment.
- Keep a consistent spacing scale based on 4px: 4, 8, 12, 16, 24, 32, 48, 64.
- Keep classes and tokens aligned with project naming conventions.

### Enforce accessibility
- Contrast: 4.5:1 for normal text, 3:1 for large text.
- Meaningful `alt` text, or `alt=""` for decorative images.
- Visible focus states.
- Accessible names for interactive elements.
- Labels and `aria-describedby` wiring for forms.
- Reduced or disabled motion under `prefers-reduced-motion`.

### Push the aesthetics deliberately
Focus on:
- Typography: pair a distinctive display font with a refined body font.
- Color: use a cohesive palette with strong dominant choices and sharp accents.
- Motion: orchestrate a few high-impact moments instead of scattering weak micro-interactions.
- Spatial composition: asymmetry, overlap, diagonal flow, or controlled density when it serves the concept.
- Atmosphere: gradients, textures, patterns, layered transparencies, dramatic shadows, decorative borders, grain, or custom cursors when appropriate.

### Final quality bar
Ship only when the result is:
- Functional and production-grade
- Visually memorable
- Cohesive around a clear aesthetic point of view
- Refined in spacing, hierarchy, and interaction details
