# AI Watchtower

AI security research blog: prompt injection, MCP vulnerabilities, agent threat models, and hardening playbooks for LLM-based systems.

Bilingual (FR / EN), built with [Hugo](https://gohugo.io/) and the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme. Deployed to GitHub Pages via GitHub Actions on every push to `main`.

🌐 https://aleph-beth.github.io/AI-Watchtower/

## Project structure

```
.
├── hugo.toml                       # Hugo configuration (multilingual FR/EN)
├── archetypes/default.md           # Frontmatter template for new posts
├── content/
│   ├── fr/
│   │   ├── _index.md               # FR homepage
│   │   ├── posts/                  # FR articles
│   │   └── search.md
│   └── en/
│       ├── _index.md               # EN homepage
│       ├── posts/                  # EN articles
│       └── search.md
├── themes/PaperMod/                # Theme (git submodule)
└── .github/workflows/hugo.yml      # GitHub Pages deploy workflow
```

## Add a new bilingual article

```bash
hugo new content/fr/posts/YYYY-MM-DD-mon-article.md
hugo new content/en/posts/YYYY-MM-DD-my-article.md
```

In each frontmatter, set the **same** `translationKey` to link the language pair (the language switcher uses it).

## Local preview (optional)

If you have Hugo (extended) installed locally:

```bash
hugo server --buildDrafts
```

Then open http://localhost:1313/.

## Clone with submodules

```bash
git clone --recurse-submodules https://github.com/aleph-beth/AI-Watchtower.git
```

If you cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

## Enable GitHub Pages

In GitHub → Settings → Pages → **Source: GitHub Actions**. The workflow at `.github/workflows/hugo.yml` does the rest.

## License

Code: see [LICENSE](LICENSE). Article content: © aleph-beth, all rights reserved unless otherwise noted in the article.
