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
  query?: {
    initialFilter?: string;
    groupByFieldsForStatistics?: string[];
    orderByFields?: string[];
    outStatistics?: { outStatisticFieldName: string }[];
  };
  groupBy?: {
    rangeField?: string;
    categoryField?: string;
    categories?: Record<string, number[]>;
  };
};
type Props = { config: ChartCfg; chartId: string; where: string };

const LineChart: React.FC<Props> = ({ config, chartId, where }) => {
  const [opts, setOpts] = useState<any>(config.options);

  useEffect(() => {
    let cancelled = false;

    loadModules(["esri/layers/FeatureLayer"]).then(([FeatureLayer]) => {
      if (cancelled) return;

      const layer = new FeatureLayer({ url: config.layer.url, outFields: ["*"] });
      const q = layer.createQuery();
      q.returnGeometry = false;
      q.where = where || config.query?.initialFilter || "1=1";
      if (config.query?.groupByFieldsForStatistics) q.groupByFieldsForStatistics = config.query.groupByFieldsForStatistics;
      if (config.query?.orderByFields) q.orderByFields = config.query.orderByFields;
      if (config.query?.outStatistics) q.outStatistics = config.query.outStatistics;

      layer.queryFeatures(q).then((res: any) => {
        const feats = (res.features || []).map((f: any) => f.attributes);

        const yearField = config.query?.groupByFieldsForStatistics?.[0] || "YEAR_";
        const causeField = config.query?.groupByFieldsForStatistics?.[1] || "CAUSE";
        const valField = config.query?.outStatistics?.[0]?.outStatisticFieldName || "value";

        const seriesMap: Record<string, Record<string, number>> = {};
        const yearSet = new Set<string>();

        for (const attrs of feats) {
          const yRaw = attrs[yearField];
          const cRaw = attrs[causeField];
          if (yRaw == null || cRaw == null) continue;

          const y = String(yRaw).trim();
          if (!y) continue;

          let category: string;
          if (config.groupBy?.categories) {
            const cats = config.groupBy.categories as Record<string, number[]>;
            const match = Object.entries(cats).find(([, ids]) => ids.includes(Number(cRaw)));
            category = match ? match[0] : String(cRaw);
          } else {
            category = String(cRaw);
          }

          const v = Number(attrs[valField] ?? 0);
          if (!seriesMap[category]) seriesMap[category] = {};
          seriesMap[category][y] = (seriesMap[category][y] || 0) + v;
          yearSet.add(y);
        }

        const years = Array.from(yearSet).filter(y => y && y.toLowerCase() !== "null").sort((a, b) => Number(a) - Number(b));

        const next = { ...config.options };
        next.xAxis = { ...(next.xAxis || {}), data: years };

        const series = Object.keys(seriesMap).map(name => ({
          name,
          type: "line",
          data: years.map(y => seriesMap[name][y] ?? 0)
        }));

        next.series = series;
        setOpts(next);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [config, where]);

  return <ChartBase id={chartId} options={opts} />;
};

export default LineChart;
