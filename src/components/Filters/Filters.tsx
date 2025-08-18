import React, { useEffect, useMemo, useState } from "react";
import { loadModules } from "esri-loader";
import MultiSelectDropdown from "./MultiSelectDropdown";
import "./Filters.css";

type DropdownCfg = { id: string; selectedTextId: string; fieldName: string; isMultiSelect: boolean };
type Props = {
  layerUrl: string;
  dropdowns: DropdownCfg[];
  defaultText: Record<string, string>;
  buttonsIds: { applyButton: string; resetButton: string };
  onApply: (sel: Record<string, string[] | string | number | null>) => void;
};

type Labeled = { code: string; name: string };

const Filters: React.FC<Props> = ({ layerUrl, dropdowns, defaultText, buttonsIds, onApply }) => {
  const [options, setOptions] = useState<Record<string, Labeled[]>>({});
  const [selected, setSelected] = useState<Record<string, string[] | string | number | null>>({});

  const yearDropdownIds = useMemo(
    () => dropdowns.filter(d => d.fieldName.toUpperCase() === "YEAR_").map(d => d.selectedTextId),
    [dropdowns]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [FeatureLayer] = await loadModules(["esri/layers/FeatureLayer"]);
      if (cancelled) return;

      const layer = new FeatureLayer({ url: layerUrl, outFields: ["*"] });
      await layer.load();

      const domainsByField: Record<string, Labeled[] | undefined> = {};
      (layer.fields || []).forEach((f: any) => {
        const cvs = f?.domain?.codedValues;
        if (Array.isArray(cvs) && cvs.length) {
          domainsByField[f.name] = cvs.map((cv: any) => ({
            code: String(cv.code),
            name: String(cv.name),
          }));
        }
      });

      const loadDistinctWithLabels = async (field: string): Promise<Labeled[]> => {
        // If domain exists, use it directly
        if (domainsByField[field]) return domainsByField[field] as Labeled[];

        // Otherwise query distinct values
        const q = layer.createQuery();
        q.where = "1=1";
        q.outFields = [field];
        q.returnGeometry = false;
        q.returnDistinctValues = true;
        q.orderByFields = [`${field} ASC`];
        const res = await layer.queryFeatures(q);
        const vals = (res.features || [])
          .map((f: any) => f.attributes[field])
          .filter((v: any) => v !== null && v !== undefined && v !== "")
          .map((v: any) => String(v));
        const uniq = Array.from(new Set(vals));
        return uniq.map(v => ({ code: v, name: v }));
      };

      const pairs = await Promise.all(
        dropdowns.map(async d => [d.selectedTextId, await loadDistinctWithLabels(d.fieldName)] as const)
      );
      if (cancelled) return;

      const next: Record<string, Labeled[]> = {};
      pairs.forEach(([k, v]) => (next[k] = v));
      setOptions(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [layerUrl, dropdowns]);

  const apply = () => onApply(selected);

  const reset = () => {
    setSelected({});
    onApply({});
  };

  const codeToName = (key: string, codes: string[] = []) => {
    const map = new Map((options[key] || []).map(o => [o.code, o.name]));
    return codes.map(c => map.get(String(c)) || String(c));
  };

  const nameToCode = (key: string, names: string[] = []) => {
    const map = new Map((options[key] || []).map(o => [o.name, o.code]));
    return names.map(n => map.get(String(n)) || String(n));
  };

  return (
    <div className="filtersBar">
      {dropdowns.map(d => {
        const key = d.selectedTextId;
        const isYear = yearDropdownIds.includes(key);
        const list = options[key] || [];

        const label =
          key === "selectedState" ? "State" :
          key === "selectedForest" ? "Forest" :
          key === "selectedCause" ? "Cause" :
          key.includes("From") ? "From" :
          key.includes("To") ? "To" : key;

        return (
          <div className="filterGroup" key={d.id}>
            <span className="filterLabel">{label}:</span>

            {d.isMultiSelect && !isYear ? (
              <MultiSelectDropdown
                options={list.map(o => o.name)}
                value={codeToName(key, (selected[key] as string[]) || [])}
                placeholder={defaultText[key] || "Select"}
                onChange={(names) => {
                  const codes = nameToCode(key, names);
                  setSelected(s => ({ ...s, [key]: codes }));
                }}
              />
            ) : (
              <select
                className="filterSelect"
                value={(selected[key] as any) ?? ""}
                onChange={e =>
                  setSelected(s => ({
                    ...s,
                    [key]: e.target.value ? Number(e.target.value) : null
                  }))
                }
              >
                <option value="">{defaultText[key] || "Select"}</option>
                {list.map(o => (
                  <option key={o.code} value={o.code}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}

      <button id={buttonsIds.applyButton} className="applyBtn" onClick={apply}>Apply</button>
      <button id={buttonsIds.resetButton} className="resetBtn" onClick={reset}>Reset</button>
    </div>
  );
};

export default Filters;
