import { ALL_CATEGORIES, categoryLabel } from "./catalogCategories.js";

export default function CategoryTabs({ categories, active, onChange }) {
  const tabs = [ALL_CATEGORIES, ...categories];
  return (
    <div className="hc-tabs" role="tablist">
      {tabs.map((c) => (
        <button
          key={c}
          type="button"
          role="tab"
          aria-selected={active === c}
          className={`hc-tab ${active === c ? "is-on" : ""}`}
          onClick={() => onChange(c)}
        >
          {c === ALL_CATEGORIES ? "Todos" : categoryLabel(c)}
        </button>
      ))}
    </div>
  );
}
