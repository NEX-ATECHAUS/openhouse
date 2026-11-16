# Open House

Find the homes open for inspection near the ones you want to see, and
get the day planned: the order, the drive between each, and a break.

```
npm install
npm run dev
```

With nothing configured it runs on sample homes. To see real open
homes, follow docs/go-live-checklist.md.

| Command | What it does |
|---|---|
| `npm test` | The planner, the Domain parser and the exports |
| `npm run lint` and `npm run typecheck` | The static gates |
| `npm run build` | A production build |
| `npm run visual` | Every component at eight widths in both themes |
| `npm run audit:ci` | Dependency advisories |

Start with `CLAUDE.md` (the rules), then `docs/data-sources.md` (where
the homes come from).
