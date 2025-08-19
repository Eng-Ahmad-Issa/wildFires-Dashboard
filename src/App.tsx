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
    filters:
      | { type: "state" | "forest" | "cause"; field: string; operator: "IN" }
      | { type: "yearRange"; field: string; operator: "BETWEEN"; fromSelector: string; toSelector: string }[];
  };
};

type SelectedMap = Record<string, string[] | string | number | null>;

const buildWhereFromConfig = (cfg: AppConfig, selected: SelectedMap) => {
  const parts: string[] = [];
  const castYear = cfg.DefinitionExpressionQuery.castYearAsInt;

  const isNumericLike = (v: unknown) =>
    typeof v === "number" || (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim()));

  const sqlList = (vals: (string | number)[]) => {
    const allNumeric = vals.every(isNumericLike);
    return allNumeric
      ? vals.map(v => String(v).trim()).join(",")
      : vals.map(v => `'${String(v).replace(/'/g, "''")}'`).join(",");
  };

  cfg.DefinitionExpressionQuery.filters.forEach(f => {
    if ((f as any).type === "yearRange") {
      const fr = selected[(f as any).fromSelector] as number | null;
      const to = selected[(f as any).toSelector] as number | null;
      const fld = castYear ? `CAST(${(f as any).field} AS INT)` : (f as any).field;
      if (fr && to) parts.push(`${fld} BETWEEN ${fr} AND ${to}`);
      else if (fr && !to) parts.push(`${fld} >= ${fr}`);
      else if (!fr && to) parts.push(`${fld} <= ${to}`);
      return;
    }
    const ff = f as { type: "state" | "forest" | "cause"; field: string };
    const key = ff.type === "state" ? "selectedState" : ff.type === "forest" ? "selectedForest" : "selectedCause";
    const vals = (selected[key] as (string | number)[]) || [];
    if (vals.length) parts.push(`${ff.field} IN (${sqlList(vals)})`);
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
  <div className="appShell">
    <Header />
    <Filters
      layerUrl={config.layer.url}
      dropdowns={config.dropdowns}
      defaultText={config.defaultText}
      buttonsIds={config.ButtonsIds}
      onApply={setSelected}
    />
    <main className="mainContent">
      <div className="layout">
        <div className="chartsColumn">
          {config.charts.map(c => {
            if (c.type === "bar")
              return <BarChart key={c.id} config={{ ...c, layer: config.layer }} chartId={c.id} where={where} />;
            if (c.type === "pie")
              return <PieChart key={c.id} config={{ ...c, layer: config.layer }} chartId={c.id} where={where} />;
            if (c.type === "line")
              return <LineChart key={c.id} config={{ ...c, layer: config.layer, groupBy: c.groupBy }} chartId={c.id} where={where} />;
            return null;
          })}
        </div>
        <div className="mapArea">
          <MapView layerUrl={config.layer.url} where={where} />
        </div>
      </div>
    </main>
  </div>
);

};

export default App;
