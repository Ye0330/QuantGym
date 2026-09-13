# QuantGym

Build mental-math fluency and number-sequence reasoning with focused practice, step-by-step lessons, and a history that stays in your browser.

**[Open QuantGym](https://ye0330.github.io/QuantGym/)** · [Deployment status](https://github.com/Ye0330/QuantGym/actions/workflows/pages.yml)

QuantGym is a static React, TypeScript, and Vite application. Questions are generated and checked on your device. No account or backend service is required.

## Practice

| Mode | Session |
| --- | --- |
| Quick sprint | Two minutes; answer as many questions correctly as you can. |
| Adaptive | Three minutes; focus on weaker skills, with difficulty adjusted every five questions. |
| 80 in 8 | Up to 80 questions in eight minutes: +1 correct, −1 incorrect, 0 skipped. |
| Free practice | 20 untimed questions, with worked explanations after mistakes and skips. |
| Mistake retry | Revisit missed questions at your own pace. |

Choose addition, subtraction, multiplication, division, percentages, fractions, decimal multiplication, decimal division, or sequences. Combine individual skills, or select **Mixed practice** to include them all. Mixed clears the individual selections; removing the last individual selection restores Mixed.

Mental-math questions support **Typed answers** and **Multiple choice**, including lesson exercises and mistake retries. **Sequence practice** always offers four choices. Its six rule families cover constant differences, constant ratios, increasing differences, alternating steps, multiply-then-add rules, and interleaved sequences.

Every session tracks all questions already shown, including wrong answers and skips. Swapped factors and equivalent fraction sums count as the same problem. If the selected question pool is exhausted, the session ends with your results.

Answers are checked exactly. Enter integers, decimals, or fractions such as `3/4`; use an exact fraction for a repeating decimal.

## Learn the techniques

The 18 English lessons follow a simple progression: **worked example → guided steps → independent practice**. Exercises are untimed, with hints, explanations, and a distinction between independent answers and answers completed with help.

The multiplication ladder builds up to general three-digit products:

1. **3-digit × 1-digit:** split by place value and keep one running total.
2. **3-digit × 2-digit:** add the tens product and the units product.
3. **Near a multiple of 100:** calculate an easy product, then compensate.
4. **3-digit × 3-digit:** combine manageable partial products one at a time.

Each stage links to its own 20-question practice set. Other lessons cover rounding and compensation, useful multipliers, squares ending in 5, difference of squares, percentages, fractions, decimals, and sequence rules.

## Your data

Completed practice sessions are stored in **IndexedDB** in your browser. Training preferences use **localStorage**. QuantGym does not upload training records to a server or synchronize them between devices.

Open **Local data** in the header to manage backups:

- **Export all history** downloads a QuantGym JSON backup containing all saved sessions and any results still waiting to save.
- **Import backup** validates the whole file before saving. Identical records are skipped; a conflicting record with the same UUID causes the import to fail without replacing existing history.
- Finish the active session before importing. Imports retain your current training preferences, even when the backup includes preferences.
- If browser storage cannot be read, a separate recovery export saves only the results accessible from the current page. It may omit older history.

History and analytics display the **latest 100 sessions**. This display limit does not delete older stored records. A single backup supports up to **10,000 sessions and 50 MiB**; larger exports or imports report an error and leave stored records untouched.

Records belong to the current device, browser profile, website origin, and deployment path. Clearing site data removes local history; private browsing may discard it when the window closes. Export a backup before clearing browser data or moving devices. Renaming the repository or changing the website address also changes which local records are accessible.

The GitHub Pages edition cannot automatically read history from the original hosted Site. Importing old history requires a compatible QuantGym JSON backup. Older saved sequence explanations are displayed in English without rewriting the original records or their backup identities.

## Run locally

Requirements: **Node.js 22.13.0 or later** and **pnpm 11.19.0**.

```bash
git clone https://github.com/Ye0330/QuantGym.git
cd QuantGym
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the local address printed by Vite. Useful commands:

| Command | Purpose |
| --- | --- |
| `pnpm test` | Check question generation, grading, lessons, session behavior, and backups. |
| `pnpm build` | Run TypeScript checks and create the production files in `dist/`. |
| `pnpm preview` | Serve the production build locally. |

Use a local server to open the app. Asset paths are relative, so the build works at a repository subpath such as `/QuantGym/` as well as at a domain root.

## Deploy with GitHub Pages

To host your own copy:

1. Fork this repository, or push its source to the `main` branch of your own repository. Include `.github/workflows/pages.yml` and `pnpm-lock.yaml`.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. The workflow is already included; no additional template is needed.
3. Open **Actions → Deploy QuantGym to GitHub Pages → Run workflow**. Future pushes to `main` deploy automatically. If an earlier run failed before Pages was enabled, rerun the failed jobs.
4. Wait for both the build and deployment jobs to succeed, then open the URL shown in the deployment result.

The workflow installs locked dependencies, runs the tests, builds the app, and deploys `dist/`. It uses GitHub's workflow token; no personal access token or application secrets are needed. Pages must be enabled once through the repository settings.

See GitHub's [publishing-source setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Do not commit `node_modules/`, personal JSON backups, browser data, or environment files. The app has no cloud database or account service to configure.

## Project structure

| Path | Contents |
| --- | --- |
| `components/quantgym.tsx` | Practice, results, analytics, mistake review, and backup controls. |
| `components/quant-learn.tsx` | Worked examples and interactive lesson exercises. |
| `lib/quant-engine.ts` | Question generation, exact answers, timing, scoring, and session deduplication. |
| `lib/quant-lessons.ts` / `lib/multiplication-lessons.ts` | Lesson content and multiplication stages. |
| `lib/local-data.ts` | Local history storage, backup validation, and atomic imports. |
| `tests/` | Behavioral and mathematical checks. |
| `.github/workflows/pages.yml` | GitHub Pages build and deployment. |

QuantGym uses original practice questions and its own presets. It is not affiliated with a trading firm or assessment provider. Third-party notices are included in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); they do not assign a license to QuantGym's original code.
