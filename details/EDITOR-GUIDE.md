# Detail page editor guide

Each "More details" button on the main page links to a content file in this folder.

## Creating a detail page

1. Find the `#id` on the card in `webpage.html` (e.g. `--- Specific question #specific-question`).
2. Create `details/{id}.txt` with that same id (e.g. `details/specific-question.txt`).

If no `.txt` file exists (or it is empty), the button is hidden automatically.

## File format

Optional title line at the top, then content:

```text
TITLE: Orientation: My topic title

## Section heading

Paragraph text here. Blank line starts a new paragraph.
```

- **`TITLE:`** — shown in the overlay header and browser tab when previewing standalone. If omitted, the card title from the main page is used.
- Content uses the same mini-markup as the main page detail syntax.

## Syntax

| Line starts with | Result |
|------------------|--------|
| `## Heading` | Section title |
| `### Subheading` | Subsection title |
| blank line | New paragraph |
| `---` | Horizontal rule |
| `EXAMPLE heading` | Highlighted example box (heading on same line) |
| `IMPORTANT heading` | Highlighted warning box |

Inline HTML is OK: `<em>Label:</em>`, `<a href=#id>`, `<i>emphasis</i>`, `<sup class="cite-ref" data-cite="Author Year"></sup>`

Math: `\(...\)` or `\[...\]`