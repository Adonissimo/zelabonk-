# Deploy Zelabonk with GitHub and Vercel (Windows)

This ZIP contains the game source, including the landmark arenas, separate maps without portals, the hero and enemy animation overhaul, the Adventure map-results screen, the unlockable Ocarina of Time allies, reference-based moves, and Adventure companions. GitHub stores the source. Vercel serves the static browser game. The optional local backend is not deployed by these steps.

## 1. Open or clone your existing GitHub repo

If you already have a local clone, open **PowerShell in that repo**. Otherwise:

```powershell
git clone https://github.com/Adonissimo/zelabonk-.git
cd zelabonk-
```

Check the remote and working tree before copying anything:

```powershell
git remote -v
git status -sb
git switch main
git pull --ff-only origin main
git log -5 --oneline
```

The remote should be `Adonissimo/zelabonk-`. If `git status` shows local changes, save or commit them before proceeding. If `git pull --ff-only` refuses to run, stop rather than forcing a push. This ZIP was based on `b800ee2`; if your repo has commits after that, compare the files before replacing them so you keep your newer work.

## 2. Copy, test, then push

1. Extract the ZIP somewhere **outside** the clone. Open the extracted `Zelabonk` folder.
2. Copy the **contents** of that folder (including `.vercelignore`) into the clone. Keep the clone’s existing hidden `.git` folder. Confirm `index.html` and `vercel.json` are at the repo root, not one level down. Do not commit the ZIP, `node_modules`, `.env`, or `.local-data`.
3. To try it locally, run `npm start` from the repo and open [http://127.0.0.1:4173](http://127.0.0.1:4173). You do not need to install packages to run the browser game. Stop the local server with Ctrl+C.

```powershell
node --test "tests/*.test.cjs"
git status --short
git diff --stat
git add -A
git diff --cached --name-status
git commit -m "Add landmark guardians and improve hero combat"
git push origin main
git rev-parse --short HEAD
```

Review the staged list before committing. Save the short commit ID printed by the last command.

## 3. Check production on Vercel

**Already linked?** Keep your current Vercel project. In its **Git** or **Environments** settings, confirm the GitHub repo is `Adonissimo/zelabonk-` and your production branch is `main`. A push to that linked production branch will trigger a deployment. In **Deployments**, wait for the deployment with your commit ID to show **Ready**, then open the production domain. This repo's README lists [zelabonk.vercel.app](https://zelabonk.vercel.app).

**Not linked yet?** In Vercel, choose **Add New… → Project**, import `Adonissimo/zelabonk-`, and select the repository root. The included `vercel.json` selects **Other**, skips build/install, and serves output from the repo root (`.`). No environment variables are required for the static game. Click **Deploy**, then confirm the production branch and domain.

If you prefer a preview first, create a branch with `git switch -c zelabonk-update` before copying the files, then push it with `git push -u origin zelabonk-update` instead of pushing main. Check its Vercel Preview, then open a GitHub pull request into main. A preview URL may not show saves from your production domain.

If your repository already has the Hero Art and Ultimates release, the only new game files you need to replace are `app.js`, `core.js`, and `companions.js`. If your deployed version is older, use the full ZIP contents so that all required browser scripts reach the repo root. Keep the existing GitHub history.

If your GitHub repo already has the Franchise Moves and Allies release, upload `app.js`, `art.js`, `core.js`, and `styles.css` to the repository root; otherwise use the whole ZIP.

To test the cracks, open Training Grounds, spawn a dummy, and try Darunia’s hammer and body slam, then Skull Kid’s Moon Crash. The hammer leaves a small split, the slam a wider break, and the Moon the largest fracture. The cracks fade and do not change collision.

Test the production page before sharing it: start a Survival run and check that your map selection sticks; try the updated hero portraits, Skull Kid’s hover, and a few Ultimates in Training Grounds; defeat Gohma in Adventure, confirm Saria joins and stays through Continue and reload, and confirm the maps still have no portals.

Official references: [GitHub push workflow](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository) · [Vercel Git deployments](https://vercel.com/docs/git) · [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json).
