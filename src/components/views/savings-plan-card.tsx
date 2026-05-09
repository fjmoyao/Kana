"use client";

import type { SavingsPlanProps } from "../../types/views";
import {
  formatCop,
  getDifficultyTone,
} from "./view-helpers";

const DISPLAY_SERIF =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';

export function SavingsPlanCard({ recommendations }: SavingsPlanProps) {
  const rankedRecommendations = [...recommendations].sort(
    (left, right) => right.estimated_savings_cop - left.estimated_savings_cop,
  );
  const totalPotential = rankedRecommendations.reduce(
    (sum, item) => sum + item.estimated_savings_cop,
    0,
  );

  return (
    <section className="w-full overflow-hidden rounded-[28px] border border-emerald-200 bg-[linear-gradient(145deg,#f0fdf4_0%,#fffbeb_54%,#ffffff_100%)] p-5 text-stone-900 shadow-[0_18px_45px_rgba(22,101,52,0.08)] sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-emerald-700/70">
              Savings Plan
            </p>
            <h2
              className="mt-2 text-3xl text-stone-950 sm:text-[2.45rem]"
              style={{ fontFamily: DISPLAY_SERIF }}
            >
              Next-bill moves worth making
            </h2>
          </div>
          <div className="rounded-[20px] border border-emerald-200 bg-white/80 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
              Potential monthly impact
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">
              {formatCop(totalPotential)}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {rankedRecommendations.map((recommendation, index) => (
            <article
              key={`${recommendation.action}-${index}`}
              className="grid gap-4 rounded-[24px] border border-stone-200 bg-white/90 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-sm font-semibold text-white">
                {index + 1}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-stone-900">
                    {recommendation.action}
                  </h3>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getDifficultyTone(
                      recommendation.difficulty,
                    )}`}
                  >
                    {recommendation.difficulty}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {recommendation.reasoning}
                </p>
              </div>

              <div className="md:text-right">
                <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
                  Estimated savings
                </p>
                <p className="mt-2 text-lg font-semibold text-emerald-700">
                  ~{formatCop(recommendation.estimated_savings_cop)}/mes
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
