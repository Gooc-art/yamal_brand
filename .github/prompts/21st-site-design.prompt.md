Use 21st.dev Magic as a local design exploration tool for `yamal_catalog_site_php`, then implement the selected direction directly in this repository.

Context:
- Active product: `yamal_catalog_site_php`
- Production stack: PHP template in `index.php`, CSS in `assets/styles.css`, vanilla JS in `assets/app.js`
- The production site does not use React, Next.js, or Tailwind at runtime

Hard constraints:
- Treat 21st output as visual/reference material, not as drop-in runtime code
- Keep the catalog, assistant, and `Лаборатория решений` grounded in real sections, files, and deterministic UI flows
- Preserve desktop and mobile layouts
- Prefer bold, intentional composition over generic SaaS cards, but stay practical and readable
- Do not introduce a frontend build step unless explicitly asked

Workflow:
1. Inspect the current PHP/CSS/JS before proposing changes
2. Use 21st Magic to explore 2-3 UI directions or components
3. Choose one direction and translate it into the repo's existing PHP/CSS/JS patterns
4. Keep documentation and tests in sync with any real code changes

Good targets for 21st exploration:
- hero block
- main section cards
- floating assistant dialog
- `Лаборатория решений` entry cards
- constructor layout and preview shell

Prompt examples:
- `/ui redesign the hero section for an official regional brand library with a strong editorial look, desktop + mobile`
- `/ui create compact but expressive section cards for a brand asset catalog, with clear active states`
- `/ui design a grounded assistant side panel for a document and asset catalog, not a generic AI chatbot`
