# Issue tracker: Local markdown

Issues and PRDs for this repo live as markdown files under `.scratch/<feature>/`. Each issue is a single `.md` file.

## File structure

```
.scratch/
├── <feature-name>/
│   ├── 001-issue-title.md
│   ├── 002-another-issue.md
│   └── prd.md              ← optional PRD for the feature
└── <another-feature>/
    └── 001-something.md
```

## Conventions

- **Create an issue**: Write a new `.md` file under `.scratch/<feature>/`. Use a sequential number prefix (e.g. `001-`, `002-`). The filename should be a kebab-case summary.
- **Read an issue**: `Read` the `.md` file directly.
- **List issues**: `ls .scratch/<feature>/` or `Glob` for `**/.scratch/**/*.md`.
- **Update an issue**: `Edit` the `.md` file directly — append comments, update status, etc.
- **Close an issue**: Add `status: closed` to the frontmatter, or delete the file if it's no longer needed.

## Issue file format

```markdown
---
title: Short description
status: open | closed
labels: [needs-triage]
created: YYYY-MM-DD
---

# Issue title

Description of the issue...
```

## When a skill says "publish to the issue tracker"

Create a new `.md` file under `.scratch/<feature>/`.

## When a skill says "fetch the relevant ticket"

Read the corresponding `.md` file from `.scratch/`.
