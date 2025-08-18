import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Header from "./components/Header/Header";
import Filters from "./components/Filters/Filters";
import MapView from "./components/MapView/MapView";
import BarChart from "./components/BarChart/BarChart";
import PieChart from "./components/PieChart/PieChart";
import LineChart from "./components/LineChart/LineChart";

type AppConfig = {
  mapSettings: { basemap: string; initialCenter: number[]; initialZoom: number };
  layer: { url: string };
  dropdowns: { id: string; selectedTextId: string; fieldName: string; isMultiSelect: boolean }[];
  defaultText: Record<string, string>;
  charts: { id: string; type: string; options: any; query?: any; topLimit?: number; groupBy?: any }[];
  ButtonsIds: { applyButton: string; resetButton: string; maximizeButtons: string };
  DefinitionExpressionQuery: {
    castYearAsInt?: boolean;
    filters: (
      | { type: "state" | "forest" | "cause"; field: string; operator: "IN" }
      | { type: "yearRange"; field: string; operator: "BETWEEN"; fromSelector: string; toSelector: string }
    )[];
  };
};

type SelectedMap = Record<string, string[] | string | number | null>;

const buildWhereFromConfig = (cfg: AppConfig, selected: SelectedMap) => {
  const parts: string[] = [];
  const castYear = cfg.DefinitionExpressionQuery.castYearAsInt;

  const isNumericLike = (v: unknown) =>
    typeof v === "number" || (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim()));

  const sqlList = (vals: (string | number)[], field: string) => {
    const allNumeric = vals.every(isNumericLike);
    return allNumeric
      ? vals.map(v => String(v).trim()).join(",")
      : vals.map(v => `'${String(v).replace(/'/g, "''")}'`).join(",");
  };

  cfg.DefinitionExpressionQuery.filters.forEach(f => {
    if (f.type === "yearRange") {
      const from = selected[f.fromSelector] as number | null;
      const to = selected[f.toSelector] as number | null;
      if (from && to) {
        const field = castYear ? `CAST(${f.field} AS INT)` : f.field;
        parts.push(`${field} BETWEEN ${from} AND ${to}`);
      } else if (from && !to) {
        const field = castYear ? `CAST(${f.field} AS INT)` : f.field;
        parts.push(`${field} >= ${from}`);
      } else if (!from && to) {
        const field = castYear ? `CAST(${f.field} AS INT)` : f.field;
        parts.push(`${field} <= ${to}`);
      }
      return;
    }

    const key =
      f.type === "state" ? "selectedState" :
      f.type === "forest" ? "selectedForest" :
      "selectedCause";

    const vals = (selected[key] as (string | number)[]) || [];
    if (vals.length) {
      const list = sqlList(vals, f.field);
      parts.push(`${f.field} IN (${list})`);
    }
  });

  return parts.length ? parts.join(" AND ") : "1=1";
};


const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [selected, setSelected] = useState<SelectedMap>({});

  useEffect(() => {
    fetch("/config.json").then(r => r.json()).then((d: AppConfig) => setConfig(d));
  }, []);

  const where = useMemo(() => (config ? buildWhereFromConfig(config, selected) : "1=1"), [config, selected]);

  if (!config) return null;

  return (
    <div>
      <Header />
      <Filters
        layerUrl={config.layer.url}
        dropdowns={config.dropdowns}
        defaultText={config.defaultText}
        buttonsIds={config.ButtonsIds}
        onApply={setSelected}
      />
      <MapView layerUrl={config.layer.url} where={where} />
      <div className="chartGrid">
        {config.charts.map(c => {
          if (c.type === "bar")
            return <BarChart key={c.id} config={{ ...c, layer: config.layer }} chartId={c.id} where={where} />;
          if (c.type === "pie")
            return <PieChart key={c.id} config={{ ...c, layer: config.layer }} chartId={c.id} where={where} />;
          if (c.type === "line")
            return (
              <LineChart
                key={c.id}
                config={{ ...c, layer: config.layer, groupBy: c.groupBy }}
                chartId={c.id}
                where={where}
              />
            );
          return null;
        })}
      </div>
    </div>
  );
};

export default App;
