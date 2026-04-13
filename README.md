# Microsoft Agent Hub — GitHub Pages Edition

A static version of [Agent Hub](https://app-agent-hub.azurewebsites.net) that runs entirely on GitHub Pages. No server, no database — all agent data lives as JSON files in this repo.

---

## How It Works

| What | How |
|---|---|
| **Hosting** | GitHub Pages (free, static) |
| **Agent data** | JSON files in `data/agents/` |
| **Submit agents** | Sign in with GitHub → fill out form → auto-creates a PR |
| **Quality scoring** | GitHub Actions evaluates completeness on every PR |
| **Discussions** | [giscus](https://giscus.app/) embeds GitHub Discussions on each agent page |
| **Favorites** | Saved in browser localStorage |
| **Search & filter** | Client-side filtering over a pre-built index |
| **Solution downloads** | Files stored in `solutions/` directory |

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env
# Edit .env with your GitHub OAuth App client ID

# Run locally
npm run dev
```

The site runs at `http://localhost:5173`.

---

## Adding an Agent

### Option A: Via the Website (Recommended)
1. Go to the site and click **Submit Agent**
2. Sign in with your GitHub account
3. Fill out the form
4. Click **Submit** — this creates a PR automatically
5. A maintainer reviews and merges it
6. The site rebuilds and your agent appears

### Option B: Via Pull Request
1. Fork this repo
2. Copy `data/agents/_template.json` to `data/agents/your-agent-name.json`
3. Fill in all the fields
4. (Optional) Add solution files to `solutions/` and screenshots to `screenshots/`
5. Open a PR
6. GitHub Actions will evaluate your agent and post a quality score

---

## Project Structure

```
├── .github/workflows/
│   ├── deploy.yml            # Build & deploy to GitHub Pages on push to main
│   └── evaluate-pr.yml       # Score agent quality on PRs
├── data/
│   └── agents/               # One JSON file per agent
│       └── _template.json    # Template for new agents
├── scripts/
│   ├── build-index.ts        # Generates search index from agent files
│   └── evaluate-agent.ts     # Quality scoring logic
├── solutions/                # Downloadable solution files (.zip, .msapp)
├── screenshots/              # Agent screenshots
├── src/                      # React SPA
│   ├── auth/                 # GitHub OAuth (device flow)
│   ├── components/           # Navbar, AgentCard, SearchBar, TopicViewer, etc.
│   ├── hooks/                # useFavorites (localStorage)
│   ├── pages/                # Home, AgentDetail, SubmitAgent
│   └── services/             # Static data fetcher, GitHub API client
└── public/                   # Static assets
```

---

## Setup

### 1. GitHub OAuth App

Create a GitHub OAuth App for the submit feature:

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set:
   - **Application name**: Agent Hub
   - **Homepage URL**: Your GitHub Pages URL
   - **Authorization callback URL**: Your GitHub Pages URL
4. Note the **Client ID** (no secret needed for device flow)
5. Under the app settings, enable **Device Flow**
6. Set `VITE_GITHUB_CLIENT_ID` in your `.env`

### 2. Giscus (Discussions)

Enable discussions/comments on agent pages:

1. Enable **Discussions** on your repo (Settings → General → Features)
2. Create a "Agent Discussions" category in Discussions
3. Go to [giscus.app](https://giscus.app/) and configure it for your repo
4. Copy the `data-repo`, `data-repo-id`, and `data-category-id` values
5. Set `VITE_GISCUS_REPO`, `VITE_GISCUS_REPO_ID`, and `VITE_GISCUS_CATEGORY_ID`

### 3. GitHub Pages

1. Go to repo **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` — the deploy workflow runs automatically

---

## Quality Scoring

Agents are scored 0-5 based on completeness:

| Criteria | Points |
|---|---|
| Has name, description, overview | 1.0 |
| Has instructions | 0.5 |
| Has 1+ topics | 0.5 |
| Topics include YAML | 0.5 |
| Topics have trigger phrases | 0.25 |
| Has 1+ tools | 0.5 |
| Has category | 0.25 |
| Has 2+ tags | 0.25 |
| Has solution file | 0.5 |
| Has GitHub URL | 0.25 |
| Has additional sections | 0.25 |
| Has screenshots | 0.25 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, React Router 7 |
| Auth | GitHub OAuth (Device Flow) |
| Data | Static JSON files, client-side search |
| Comments | giscus (GitHub Discussions) |
| Quality | Automated scoring via GitHub Actions |
| Hosting | GitHub Pages |

---

## License

Internal use only — Microsoft.
