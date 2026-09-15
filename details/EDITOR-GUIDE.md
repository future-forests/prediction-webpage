# Detail page editor guide

Each "More details" button on the main page links to a Markdown file in this folder.

## Creating a detail page

1. Find the `#id` on the line in `webpage.html` (e.g. `## INTRO #intro`, `## GLOSSARY #glossary`, `--- Specific question #specific-question`).
2. Create `details/{id}.md` with that same id (e.g. `details/intro.md`, `details/glossary.md`).

If no `.md` file exists (or it is empty), the button is hidden automatically.

## Markdown

Detail pages use standard Markdown. See the [Markdown Guide](https://www.markdownguide.org/basic-syntax/) for headings, lists, bold, italic, links, footnotes, and more. Inline HTML also works. Math uses `\(...\)` inline and `\[...\]` for display (MathJax).

## Internal links

Link to another card or section on the main page using its `#id` from `webpage.html`:

```markdown
See [parameterisation](#parameterisation) for more.
[Stage 1](#setting-stage) defines the prediction goal.
```

## References

Cite a work from the central bibliography (`scripts/references.js`) with `[@Author Year]`:

```markdown
Spatial discretisation may require re-formulating process parameters.[@Chipperfield 2011]
```

The key must match an entry in `scripts/references.js` exactly (e.g. `Dormann 2026`, `Spake 2023`). Add new references there first.
