'use client';

import React from 'react';

/** Preset duration choices in months */
export const DURATION_PRESETS = [
  { label: '1 mo', months: 1 },
  { label: '2 mo', months: 2 },
  { label: '3 mo', months: 3 },
  { label: '6 mo', months: 6 },
  { label: '1 yr', months: 12 },
  { label: 'Ongoing', months: -1 },
  { label: 'Custom', months: 0 },
] as const;

interface AmortizedDurationPresetsProps {
  selectedPresetMonths: number;
  onSelectPreset: (months: number) => void;
  hasLifespan: boolean;
  calculatedMonths: number;
}

export function AmortizedDurationPresets({
  selectedPresetMonths,
  onSelectPreset,
  hasLifespan,
  calculatedMonths,
}: AmortizedDurationPresetsProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-mono font-semibold text-[#1B1A18] flex items-center justify-between">
        <span>Lifespan *</span>
        <span className="text-[11px] font-mono font-normal text-[#625E59]">
          {hasLifespan ? `${calculatedMonths} mo amortization` : 'Ongoing'}
        </span>
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {DURATION_PRESETS.map((preset) => {
          const isSelected = selectedPresetMonths === preset.months;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelectPreset(preset.months)}
              className={`h-8 px-1 text-xs font-mono font-semibold rounded-[2px] transition-colors text-center flex items-center justify-center ${
                isSelected
                  ? 'bg-[#E65B3F] text-white border border-[#E65B3F] font-bold'
                  : 'bg-white text-[#625E59] border border-[#DED9D2] hover:border-[#1B1A18]'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

