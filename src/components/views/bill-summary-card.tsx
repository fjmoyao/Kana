"use client";

import type { BillSummaryProps } from "../../types/views";
import {
  formatCop,
  formatUsage,
  getBiggestDriverLabel,
  getDueState,
  getServiceBreakdown,
  SERVICE_META,
} from "./view-helpers";

const DISPLAY_SERIF =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

export function BillSummaryCard({
  bill,
  biggest_driver,
}: BillSummaryProps) {
  const services = getServiceBreakdown(bill);
  const dueState = getDueState(bill.due_date);
  const biggestDriver = SERVICE_META[biggest_driver];

  return (
    <section className="w-full overflow-hidden rounded-[28px] border border-stone-200 bg-[linear-gradient(140deg,#fffdf7_0%,#fff7ed_55%,#ffffff_100%)] p-5 text-stone-900 shadow-[0_18px_45px_rgba(120,53,15,0.08)] sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">
              Bill Summary
            </p>
            <div>
              <h2
                className="text-3xl leading-none text-stone-900 sm:text-[2.7rem]"
                style={{ fontFamily: DISPLAY_SERIF }}
              >
                {formatCop(bill.total_due)}
              </h2>
              <p className="mt-2 text-sm text-stone-600">{bill.billing_period}</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: biggestDriver.surface,
                borderColor: `${biggestDriver.accent}33`,
                color: biggestDriver.ink,
              }}
            >
              Biggest driver: {getBiggestDriverLabel(biggest_driver)}
            </span>
            {dueState ? (
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${dueState.className}`}
              >
                <span>{dueState.label}</span>
                <span className="opacity-70">{dueState.description}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-[24px] border border-stone-200/80 bg-white/80 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-stone-700">Service breakdown</p>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
              Medellín household
            </p>
          </div>

          <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
            {services.map((service) => (
              <div
                key={service.service}
                className="min-w-[10px]"
                style={{
                  width: `${service.share}%`,
                  backgroundColor: SERVICE_META[service.service].fill,
                }}
              />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => {
              const meta = SERVICE_META[service.service];

              return (
                <div
                  key={service.service}
                  className="rounded-[20px] border p-3"
                  style={{
                    backgroundColor: meta.surface,
                    borderColor: `${meta.accent}26`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: meta.ink }}
                      >
                        {meta.label}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {service.usage !== null && service.unit
                          ? formatUsage(service.usage, service.unit)
                          : "Fixed and third-party charges"}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-stone-500">
                      {service.share.toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-stone-900">
                    {formatCop(service.cost)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-[24px] border p-4"
          style={{
            backgroundColor: biggestDriver.surface,
            borderColor: `${biggestDriver.accent}26`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Why this month feels expensive
              </p>
              <p
                className="mt-2 text-lg font-semibold"
                style={{ color: biggestDriver.ink }}
              >
                {getBiggestDriverLabel(biggest_driver)} is carrying the bill.
              </p>
            </div>
            <p className="text-sm text-stone-600">
              {formatCop(services.find((item) => item.service === biggest_driver)?.cost ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
