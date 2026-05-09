"use client";

import type { BenchmarkProps } from "../../types/views";
import {
  comparisonPosition,
  formatUsage,
  getComparisonLabel,
  getComparisonTone,
  SERVICE_META,
} from "./view-helpers";

const DISPLAY_SERIF =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

export function BenchmarkCard({
  bill,
  matching_personas,
  comparisons,
}: BenchmarkProps) {
  return (
    <section className="w-full overflow-hidden rounded-[28px] border border-stone-200 bg-[linear-gradient(160deg,#ffffff_0%,#f8fafc_52%,#fefce8_100%)] p-5 text-stone-900 shadow-[0_18px_45px_rgba(51,65,85,0.08)] sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">
              Persona Benchmark
            </p>
            <h2
              className="mt-2 text-3xl text-stone-950 sm:text-[2.4rem]"
              style={{ fontFamily: DISPLAY_SERIF }}
            >
              You vs similar households
            </h2>
          </div>
          <div className="rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-medium text-stone-600">
            Estrato {bill.stratum}
          </div>
        </div>

        <div className="grid gap-3">
          {comparisons.map((comparison) => {
            const meta = SERVICE_META[comparison.service];
            const gauge = comparisonPosition(comparison);
            const unit = comparison.service === "electricity" ? "kWh" : "m³";

            return (
              <div
                key={comparison.service}
                className="rounded-[22px] border border-stone-200 bg-white/85 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: meta.ink }}
                    >
                      {meta.label}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {formatUsage(comparison.user_value, unit)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getComparisonTone(
                      comparison.status,
                    )}`}
                  >
                    {getComparisonLabel(comparison.status)}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="relative h-3 rounded-full bg-stone-100">
                    <div
                      className="absolute top-0 h-3 rounded-full"
                      style={{
                        left: `${gauge.bandStart}%`,
                        width: `${gauge.bandWidth}%`,
                        backgroundColor: `${meta.accent}55`,
                      }}
                    />
                    <div
                      className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white shadow"
                      style={{
                        left: `calc(${Math.min(Math.max(gauge.position, 0), 100)}% - 10px)`,
                        backgroundColor: meta.accent,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                    <span>{formatUsage(gauge.min, unit)}</span>
                    <span>persona band</span>
                    <span>{formatUsage(gauge.max, unit)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {matching_personas.slice(0, 3).map((persona) => (
            <article
              key={persona.id}
              className="rounded-[22px] border border-stone-200 bg-stone-950 p-4 text-stone-50"
            >
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-400">
                {persona.zone}
              </p>
              <h3 className="mt-2 text-base font-semibold">{persona.label}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                {persona.usage_profile}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-300">
                <span className="rounded-full border border-stone-700 px-2.5 py-1">
                  {persona.household_size} people
                </span>
                <span className="rounded-full border border-stone-700 px-2.5 py-1">
                  {persona.work_pattern}
                </span>
                <span className="rounded-full border border-stone-700 px-2.5 py-1">
                  {persona.home_type}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
