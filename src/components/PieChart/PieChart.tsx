import React, { useEffect, useState } from "react";
import { loadModules } from "esri-loader";
import ChartBase from "../ChartBase/ChartBase";
import "../ChartBase/ChartBase.css";

type LayerConfig = { url: string };
type ChartCfg = {
  id: string;
  type: string;
  options: any;
  layer: LayerConfig;
  topLimit?: number;
  query?: {
    initialFilter?: string;
    groupByFieldsForStatistics?: string[];
    orderByFields?: string[];
    outStatistics?: { outStatisticFieldName: string }[];
  };
};
type Props = { config: ChartCfg; chartId: string; where: string };

const PieChart: React.FC<Props> = ({ config, chartId, where }) => {
  const [opts, setOpts] = useState<any>(config.options);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [FeatureLayer] = await loadModules(["esri/layers/FeatureLayer"]);
      if (cancelled) return;

      const layer = new FeatureLayer({ url: config.layer.url, outFields: ["*"] });
      await layer.load();

      const q = layer.createQuery();
      q.returnGeometry = false;
      q.where = where || config.query?.initialFilter || "1=1";
      if (config.query?.groupByFieldsForStatistics) q.groupByFieldsForStatistics = config.query.groupByFieldsForStatistics;
      if (config.query?.orderByFields && config.query.orderByFields.length) q.orderByFields = config.query.orderByFields;
      if (config.query?.outStatistics) q.outStatistics = config.query.outStatistics;

      const res: any = await layer.queryFeatures(q);
      const feats = res.features || [];

      const grp = config.query?.groupByFieldsForStatistics?.[0] || "";
      const valField = config.query?.outStatistics?.[0]?.outStatisticFieldName || "value";

      let toName = (code: any) => String(code);
      const fld = (layer.fields || []).find((f: any) => f.name === grp);
      if (fld?.domain?.codedValues?.length) {
        const map = new Map<string, string>(fld.domain.codedValues.map((cv: any) => [String(cv.code), String(cv.name)]));
        toName = (code: any) => map.get(String(code)) ?? String(code);
      }

      const agg = new Map<string, number>();
      for (const f of feats) {
        const code = f.attributes[grp];
        if (code == null) continue;
        const name = toName(code);
        if (!name || name.toLowerCase() === "null") continue;
        const v = Number(f.attributes[valField] ?? 0);
        agg.set(name, (agg.get(name) || 0) + v);
      }

      let rows = Array.from(agg.entries()).sort((a, b) => b[1] - a[1]);
      if (config.topLimit && config.topLimit > 0) rows = rows.slice(0, config.topLimit);

      const data = rows.map(([name, value]) => ({ name, value }));
      const legendData = rows.map(([name]) => name);

      const next = { ...config.options };
      next.legend = { ...(next.legend || {}), data: legendData };
      next.series = [{ ...(next.series?.[0] || {}), type: "pie", data }];

      setOpts(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [config, where]);

  return <ChartBase id={chartId} options={opts} />;
};

export default PieChart;
