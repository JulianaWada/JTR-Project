"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { regionIds, serviceIds, type RegionId, type ServiceId } from "@/content/site";
import { ProjectCardView, type ProjectView } from "./ProjectCard";
import { cn } from "@/lib/cn";

function FilterGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  allLabel,
  labelFor,
}: {
  legend: string;
  options: readonly T[];
  value: T | "all";
  onChange: (v: T | "all") => void;
  allLabel: string;
  labelFor: (v: T) => string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["all", ...options] as (T | "all")[]).map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              value === o
                ? "border-primary bg-primary text-primary-ink"
                : "border-line bg-surface text-ink hover:border-primary hover:text-primary",
            )}
          >
            {o === "all" ? allLabel : labelFor(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ProjectFilter({ projects }: { projects: ProjectView[] }) {
  const t = useTranslations();
  const [service, setService] = useState<ServiceId | "all">("all");
  const [region, setRegion] = useState<RegionId | "all">("all");

  // Only offer filters that match at least one project, and skip the filter panel while the list is short.
  const serviceOptions = useMemo(() => serviceIds.filter((id) => projects.some((p) => p.service === id)), [projects]);
  const regionOptions = useMemo(() => regionIds.filter((id) => projects.some((p) => p.region === id)), [projects]);
  const showFilters = projects.length >= 4;

  const visible = useMemo(
    () => projects.filter((p) => (service === "all" || p.service === service) && (region === "all" || p.region === region)),
    [projects, service, region],
  );

  return (
    <div>
      {showFilters && (
        <>
          <div className="grid gap-6 rounded-card border border-line bg-surface p-6 lg:grid-cols-2">
            <FilterGroup
              legend={t("projects.filters.service")}
              options={serviceOptions}
              value={service}
              onChange={setService}
              allLabel={t("projects.filters.all")}
              labelFor={(v) => t(`services.${v}.name`)}
            />
            <FilterGroup
              legend={t("projects.filters.region")}
              options={regionOptions}
              value={region}
              onChange={setRegion}
              allLabel={t("projects.filters.all")}
              labelFor={(v) => t(`regions.${v}`)}
            />
          </div>
          <div className="mt-8 flex items-center justify-between gap-4">
            <p role="status" className="text-sm text-muted">
              {t("projects.filters.results", { count: visible.length })}
            </p>
            {(service !== "all" || region !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setService("all");
                  setRegion("all");
                }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("projects.filters.reset")}
              </button>
            )}
          </div>
        </>
      )}
      <ul className={cn("grid gap-6 sm:grid-cols-2", projects.length > 2 && "lg:grid-cols-3", showFilters && "mt-6")}>
        {visible.map((p) => (
          <li key={p.id}>
            <ProjectCardView project={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
