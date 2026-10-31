# The 19th Hole

Personal portfolio and résumé for Luqman Bachtiar: Data Engineering & AI.

Two ways to explore. One career. Your choice.

- **Play the course**: a retro, top-down pixel-art golf world. Walk the course, read each hole's sign and collect its card.
- **Behind the build** (`/build`): the game's style guide, with palette, type, sprites and tiles rendered from the real game code.
- **Read the CV**: a clean, conventional résumé with a PDF download.

Live at <https://lrbachtiar.github.io/resume/>.

## Develop

```sh
npm install
npm run dev
```

Preview the production build exactly as GitHub Pages serves it:

```sh
docker compose up --build   # http://localhost:8080/resume/
```

## Project demos

`public/fairwayplan/` and `public/beanmarkd/` are static, read-only builds of retired projects, run in demo mode on sample data. They're built in their own project folders and copied here as plain files; the portfolio build serves them as they are.

## Structure

- `src/data/`: all career content. Both experiences render from here.
- `src/pages/`: the landing page, course and CV routes.
- `src/components/`: presentation, grouped by experience.
- `.github/workflows/deploy.yml`: builds and deploys to GitHub Pages on push to `main`.
