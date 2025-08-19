import { useEffect, useRef } from "react";
import { loadModules } from "esri-loader";
import "./MapView.css";

type Props = { layerUrl: string; where: string };

const MapView: React.FC<Props> = ({ layerUrl, where }) => {
  const mapDiv = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer"], { css: true }).then(
      ([EsriMap, MapView, FeatureLayer]) => {
        if (cancelled || !mapDiv.current) return;
        const layer = new FeatureLayer({ url: layerUrl, outFields: ["*"], definitionExpression: "1=1" });
        const map = new EsriMap({ basemap: "dark-gray-vector", layers: [layer] });
        const view = new MapView({ container: mapDiv.current, map, center: [-120, 36], zoom: 5 });
        viewRef.current = view;
        layerRef.current = layer;
      }
    );
    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
      layerRef.current = null;
    };
  }, [layerUrl]);

  useEffect(() => {
    if (layerRef.current) layerRef.current.definitionExpression = where || "1=1";
  }, [where]);

  return <div id="mapView" ref={mapDiv} className="mapViewContainer" />;
};

export default MapView;
