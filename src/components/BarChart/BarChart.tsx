import React, { useEffect, useState } from "react";
import ChartBase from "../ChartBase/ChartBase";
import { loadModules } from "esri-loader";
import "../ChartBase/ChartBase.css";

type LayerConfig = { url: string };
type ChartCfg = { id: string; type: string; options: any; layer: LayerConfig; query?: any };
type Props = { config: ChartCfg; chartId: string; where: string };

const BarChart: React.FC<Props> = ({ config, chartId, where }) => {
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
        const feats = res.features || [];
        const groupField = config.query?.groupByFieldsForStatistics?.[0] || "";
        const valField = config.query?.outStatistics?.[0]?.outStatisticFieldName || "value";
        const x = feats.map((f: any) => f.attributes[groupField]);
        const y = feats.map((f: any) => f.attributes[valField] ?? 0);
        const next = { ...config.options };
        next.xAxis = { ...(next.xAxis || {}), data: x };
        next.series = [{ ...(next.series?.[0] || {}), data: y, type: "bar" }];
        setOpts(next);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [config, where]);

  return <ChartBase id={chartId} options={opts} />;
};

export default BarChart;
