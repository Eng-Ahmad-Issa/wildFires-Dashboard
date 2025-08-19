# Wildfires Insights (React + Vite + ArcGIS + ECharts)

## Repository
https://github.com/Eng-Ahmad-Issa/wildFires-Dashboard

Brief:
An interactive dashboard that visualizes historical wildfires with an ArcGIS web map and three charts (bar, pie, line). Filters (State, Forest Unit, Cause, Year range) load dynamically from the ArcGIS Feature Service — nothing is hardcoded — and all chart options/queries are driven by `public/config.json`.

## Features

- ArcGIS map with FeatureLayer and live filtering via `definitionExpression`
- Dynamic filters populated from the service (coded value **names** shown, **codes** used in queries)
- Year range (From/To) with numeric-safe SQL builder
- Charts powered by ECharts:
  - Bar: yearly fire counts
  - Pie: top causes (domain names)
  - Line: Human-caused vs Natural trends (nulls excluded)
- Fullscreen mode for each chart
- Config-driven behavior via `public/config.json`
- React + TypeScript + Vite for a fast DX

How to run it?

### Prerequisites
- Node.js ≥ 18 (LTS recommended)
- npm (bundled with Node)

Download the code from the GitHub Repository link or the zip file, then open the wildFires-Dashboard folder and open the terminal/cmd.

```bash
1) Install
npm install

2) Run in development
npm run dev



