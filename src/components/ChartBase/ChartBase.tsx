import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import "./ChartBase.css";

type Props = { options: any; id: string };

const ChartBase: React.FC<Props> = ({ options, id }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current = echarts.init(canvasRef.current);
    chartRef.current.setOption(options);

    const ro = new ResizeObserver(() => chartRef.current?.resize());
    if (wrapperRef.current) ro.observe(wrapperRef.current);

    const onWinResize = () => chartRef.current?.resize();
    window.addEventListener("resize", onWinResize);

    return () => {
      window.removeEventListener("resize", onWinResize);
      ro.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) chartRef.current.setOption(options, true);
  }, [options]);

  useEffect(() => {
    chartRef.current?.resize();
  }, [isFullscreen]);

  return (
    <div ref={wrapperRef} className={isFullscreen ? "chartWrapper fullscreenChart" : "chartWrapper"}>
      <button className="fullscreenButton" onClick={() => setIsFullscreen(!isFullscreen)}>
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </button>
      <div id={id} ref={canvasRef} className="chartCanvas" />
    </div>
  );
};

export default ChartBase;
