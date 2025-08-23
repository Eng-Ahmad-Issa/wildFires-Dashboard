import React, { useEffect, useRef, useState } from "react";

type Props = {
  options: string[];
  value: string[];
  placeholder: string;
  onChange: (v: string[]) => void;
  width?: number;
};

const MultiSelectDropdown: React.FC<Props> = ({ options, value, placeholder, onChange, width = 200 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const isChecked = (opt: string) => value?.includes(opt);
  const toggleOpt = (opt: string) => {
    const next = isChecked(opt) ? value.filter(v => v !== opt) : [...(value || []), opt];
    onChange(next);
  };

  const label =
    value && value.length
      ? value.length <= 2
        ? value.join(", ")
        : `${value.slice(0, 2).join(", ")} +${value.length - 2}`
      : placeholder;

  return (
    <div className="msd" style={{ width }} ref={ref}>
      <button type="button" className="msd-toggle" onClick={() => setOpen(v => !v)}>
        <span className={value && value.length ? "msd-text" : "msd-placeholder"}>{label}</span>
        <span className="msd-caret" />
      </button>
      {open && (
        <div className="msd-menu">
          <ul className="msd-list">
            {options.map(opt => (
              <li key={opt} className="msd-item">
                <label className="msd-option">
                  <input type="checkbox" checked={isChecked(opt)} onChange={() => toggleOpt(opt)} />
                  <span>{opt}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
