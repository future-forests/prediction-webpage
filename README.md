# Orientation for Environmental Predictions

A community-authored, interactive web resource for researchers and practitioners designing, executing, and communicating rigorous quantitative predictions in ecology and environmental science.

**Live site:** https://martawenta.github.io/prediction_webpage/basis.html

---

## How to contribute

Most edits go in **`webpage.html`** (syntax guide in the HTML comment; content in the `<script id="page-content">` block from `## INTRO`). Detail pages live in **`details/`** as Markdown (`.md`) files. One per topic, created only when there is content (see [`details/EDITOR-GUIDE.md`](details/EDITOR-GUIDE.md) and e.g. `details/setting-stage.md`).

### First-time contributors

1. **Fork** the repo on GitHub (or clone if you are a collaborator):
   ```bash
   git clone https://github.com/YOUR-USERNAME/prediction_webpage.git
   cd prediction_webpage
   ```
2. **Create a branch** from `main` (only needed once — pick a short name you will reuse):
   ```bash
   git checkout main
   git pull
   git checkout -b your-name-or-topic
   ```
3. **Edit**, commit, and push your branch:
   ```bash
   git add webpage.html   # and/or details/, scripts/, etc.
   git commit -m "Brief summary of what changed and why"
   git push -u origin your-name-or-topic
   ```
4. **Open a Pull Request** to `main` on GitHub. Describe the change in a few sentences.
5. After review and merge, the site is updated from `main` (maintainers use `push.sh` to publish to GitHub Pages).

### Returning contributors

Reuse the same branch

1. **Pull last changes from `main` and switch back to your branch:**
   ```bash
   git checkout main
   git pull
   git checkout your-name-or-topic
   ```
2. **Bring in the latest changes from `main`**:
   ```bash
   git merge main
   ```
   Resolve any merge conflicts if Git reports them, then continue.
3. **Edit**, commit, and push as before:
   ```bash
   git add webpage.html   # and/or details/, scripts/, etc.
   git commit -m "Brief summary of what changed and why"
   git push
   ```
4. **Open a Pull Request** (or update an existing one) to `main` on GitHub.