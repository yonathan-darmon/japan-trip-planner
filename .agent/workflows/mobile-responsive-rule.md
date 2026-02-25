---
description: Rule for mandatory mobile responsiveness check
---
// turbo-all
# Mandatory Mobile Responsiveness Rule

For every modification to the UI (Frontend), you MUST ensure that the components remain fully responsive and readable on mobile screens (viewport width <= 768px and <= 640px).

## Steps:
1.  **Anticipate**: When creating or modifying a layout, check how CSS properties like `flex`, `grid`, `width`, and `margin` will behave on narrow screens.
2.  **Use Media Queries**: Ensure appropriate breakpoints (`@media (max-width: 768px)`, 640px) are used to stack elements vertically, reduce paddings, or wrap texts.
3.  **Prevent Overflows**: Explicitly manage long texts and grids (e.g., `flex-wrap: wrap`, `word-wrap: break-word`, `overflow-x: auto`) to avoid items pushing outside the screen viewport.
4.  **Validate**: Consider visual tests or review via responsive design rules before deployment.
