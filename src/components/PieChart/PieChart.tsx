import React, { useEffect, useState } from "react";
import ChartBase from "../ChartBase/ChartBase";
import { loadModules } from "esri-loader";
import "../ChartBase/ChartBase.css";

type LayerConfig = { url: string };
type ChartCfg = { id: string; type: string; options: any; layer: LayerConfig; topLimit?: number; query?: any };
type Props = { config: ChartCfg; chartId: string; where: string };

const PieChart: React.FC<Props> = ({ config, chartId, where }) => {
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
      if (config.query?.orderByFields && config.query.orderByFields.length) q.orderByFields = config.query.orderByFields;
      if (config.query?.outStatistics) q.outStatistics = config.query.outStatistics;
      layer.queryFeatures(q).then((res: any) => {
        let feats = res.features || [];
        const grp = config.query?.groupByFieldsForStatistics?.[0] || "";
        const valField = config.query?.outStatistics?.[0]?.outStatisticFieldName || "value";
        feats = feats.sort((a: any, b: any) => (b.attributes[valField] ?? 0) - (a.attributes[valField] ?? 0));
        if (config.topLimit && config.topLimit > 0) feats = feats.slice(0, config.topLimit);
        const data = feats.map((f: any) => ({ name: f.attributes[grp], value: f.attributes[valField] ?? 0 }));
        const next = { ...config.options };
        next.series = [{ ...(next.series?.[0] || {}), type: "pie", data }];
        setOpts(next);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [config, where]);

  return <ChartBase id={chartId} options={opts} />;
};

export default PieChart;
