"use client";

import { useState } from "react";
import type { SectionData } from "@/lib/siteContent";
import { SERVICE_CATEGORIES } from "./categories";
import ServicesGrid from "./ServicesGrid";

const CATEGORIES = [{ id: "all", label: "Усі" }, ...SERVICE_CATEGORIES];

export default function ServicesCatalog({
  services,
}: {
  services: SectionData<"services">["services"];
}) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? services
      : services.filter((s) => s.category === activeCategory);

  // Only show categories that have services
  const availableCategories = CATEGORIES.filter(
    (c) => c.id === "all" || services.some((s) => s.category === c.id),
  );

  return (
    <div>
      <div
        className="m2-filter-bar"
        role="tablist"
        aria-label="Фільтр послуг за категорією"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}
      >
        {availableCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === c.id}
            onClick={() => setActiveCategory(c.id)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #dce5df",
              background: activeCategory === c.id ? "#12343a" : "#fff",
              color: activeCategory === c.id ? "#fff" : "#496069",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="m2-inner__lede">У цій категорії поки немає послуг.</p>
      ) : (
        <ServicesGrid services={filtered} />
      )}
    </div>
  );
}
