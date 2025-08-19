# Wildfires Insights (React + Vite + ArcGIS + ECharts)

## Repository
https://github.com/Eng-Ahmad-Issa/wildFires-Dashboard


## Getting Started

How to run it?

### Prerequisites
- Node.js ≥ 18 (LTS recommended)
- npm (bundled with Node)

1) Install
```bash
npm install

2) Run in development
npm run dev


Breif:
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



Project Structure
root
├─ public/
│  └─ config.json        # App configuration (map, layer, filters, charts)
├─ src/
│  ├─ components/
│  │  ├─ Header/
│  │  ├─ Filters/
│  │  │  ├─ Filters.tsx  # Loads domain names & distinct values, renders dropdowns
│  │  │  └─ Filters.css
│  │  ├─ MultiSelectDropdown.tsx
│  │  ├─ MapView/
│  │  │  ├─ MapView.tsx  # ArcGIS Map + FeatureLayer; updates definitionExpression
│  │  │  └─ MapView.css
│  │  ├─ ChartBase/
│  │  │  ├─ ChartBase.tsx # ECharts init/resize/fullscreen
│  │  │  └─ ChartBase.css
│  │  ├─ BarChart/BarChart.tsx
│  │  ├─ PieChart/PieChart.tsx
│  │  └─ LineChart/LineChart.tsx
│  ├─ App.tsx            # Loads config.json, builds SQL where, wires everything
│  ├─ main.tsx
│  └─ index.css
├─ package.json
└─ vite.config.ts