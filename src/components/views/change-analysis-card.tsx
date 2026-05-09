"use client";

import type { ChangeAnalysisProps } from "../../types/views";
import {
  cn,
  formatPercent,
  formatSignedValue,
  formatValue,
  getDeltaDirection,
  getDeltaTone,
  getTrendValues,
  SERVICE_META,
  sparklinePoints,
} from "./view-helpers";

const DISPLAY_SERIF =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

export function ChangeAnalysisCard({
  bills,
  deltas,
  spike_alerts,
  explanation,
}: ChangeAnalysisProps) {
  return (
    <section className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#f8fafc_0%,#eff6ff_38%,#ffffff_100%)] p-5 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">
              Change Analysis
            </p>
            <h2
              className="mt-2 text-3xl text-slate-950 sm:text-[2.45rem]"
              style={{ fontFamily: DISPLAY_SERIF }}
            >
              What changed this cycle
            </h2>
          </div>
          <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
            {bills.length} months in view
          </div>
        </div>

        {spike_alerts.length > 0 ? (
          <div className="grid gap-2">
            {spike_alerts.map((alert) => (
              <div
                key={alert}
                className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {alert}
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3">
          {deltas.map((delta) => {
            const series = getTrendValues(bills, delta.service);
            const meta =
              delta.service === "total"
                ? {
                    label: "Total",
                    accent: "#0f172a",
                    surface: "#f8fafc",
                    ink: "#0f172a",
                  }
                : SERVICE_META[delta.service];
            const direction = getDeltaDirection(delta.change_percent);

            return (
              <div
                key={delta.service}
                className="grid gap-3 rounded-[22px] border border-slate-200 bg-white/85 p-4 md:grid-cols-[minmax(0,1fr)_132px]"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: meta.ink }}
                      >
                        {meta.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatSignedValue(
                          delta.current_value - delta.previous_value,
                          delta.unit,
                        )}{" "}
                        from last bill
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-base font-semibold",
                          getDeltaTone(delta.change_percent),
                        )}
                      >
                        {direction === "up"
                          ? "▲ "
                          : direction === "down"
                            ? "▼ "
                            : ""}
                        {formatPercent(delta.change_percent)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatValue(delta.previous_value, delta.unit)} to{" "}
                        {formatValue(delta.current_value, delta.unit)}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[18px] border p-3"
                  style={{
                    backgroundColor: meta.surface,
                    borderColor: `${meta.accent}26`,
                  }}
                >
                  <svg
                    viewBox="0 0 112 34"
                    className="h-[34px] w-full"
                    aria-hidden="true"
                  >
                    <polyline
                      fill="none"
                      stroke={meta.accent}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      points={sparklinePoints(series)}
                    />
                  </svg>
                  <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    <span>{bills[0]?.billing_period?.split(" ")[0] ?? "Start"}</span>
                    <span>
                      {bills[bills.length - 1]?.billing_period?.split(" ")[0] ?? "Now"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-950 px-5 py-4 text-slate-100">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Agent explanation
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-200">{explanation}</p>
        </div>
      </div>
    </section>
  );
}
