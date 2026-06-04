<div align="center">

# 🏎️ VelocityX — F1 Live Intelligence

**Real-time Formula 1 telemetry dashboard with live driver standings, interactive track maps, weather data, and championship standings.**

[![Deploy](https://github.com/SachinthaDW/F1-Live/actions/workflows/deploy.yml/badge.svg)](https://github.com/SachinthaDW/F1-Live/actions/workflows/deploy.yml)

[**🔴 Live Demo →**](https://sachinthadw.github.io/F1-Live/)

</div>

---

## ✨ Features

- **Live Telemetry** — Real-time speed traces, RPM, gear, and DRS status per driver
- **Interactive Track Map** — SVG circuit visualization with live driver positions and smooth zoom-to-driver
- **Live Standings** — Auto-updating leaderboard with position changes, gaps, intervals, and tyre compounds
- **Race Control Feed** — Live race director messages, flag statuses, and notifications
- **Teammate Comparison** — Head-to-head intra-team battle metrics
- **Weather Widget** — Live track temperature, humidity, wind, and rainfall data
- **Championship Standings** — Full WDC and WCC standings with podium visualization
- **Season Calendar** — Complete race schedule with countdown timers and Google Calendar integration
- **Dark / Light Mode** — Apple-inspired glassmorphism design with theme toggle

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |
| APIs | [OpenF1](https://openf1.org), [Jolpi/Ergast](https://api.jolpi.ca), [Open-Meteo](https://open-meteo.com) |
| Deployment | GitHub Pages |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/SachinthaDW/F1-Live.git
cd F1-Live

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

Deployment to GitHub Pages is automatic via GitHub Actions on push to `main`/`master`.

## 🔌 Data Sources

| API | Purpose | Auth Required |
|-----|---------|---------------|
| [OpenF1](https://openf1.org) | Live telemetry, positions, track data | No |
| [Jolpi/Ergast](https://api.jolpi.ca) | Season schedule, championship standings | No |
| [Open-Meteo](https://open-meteo.com) | Weather forecasts | No |
| [Sportradar](https://developer.sportradar.com/) | Championship data (optional) | Yes (API Key) |

## 📄 License

MIT

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://www.linkedin.com/in/sachintha-wickramasinghe/">Sachintha Wickramasinghe</a></sub>
</div>
