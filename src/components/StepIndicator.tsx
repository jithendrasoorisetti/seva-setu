import React from 'react';
import { SupportedLocale, getTranslation, MessageKey } from '@/i18n';

interface StepIndicatorProps {
  currentStep: number; // 1 to 4
  totalSteps: number;
  locale: SupportedLocale;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  locale,
}) => {
  const steps: Array<{ num: number; key: MessageKey }> = [
    { num: 1, key: 'step_1_title' },
    { num: 2, key: 'step_2_title' },
    { num: 3, key: 'step_3_title' },
    { num: 4, key: 'step_5_title' },
  ];

  return (
    <nav
      aria-label="Application Progress"
      className="w-full bg-brand-surface border border-brand-border rounded-xl p-4 my-4 shadow-sm"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        {steps.slice(0, totalSteps).map((step) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;

          return (
            <div
              key={step.num}
              className={`flex items-center gap-2 flex-1 min-w-[120px] ${
                isActive ? 'font-bold' : isCompleted ? 'font-semibold' : 'font-medium'
              }`}
            >
              <div
                aria-hidden="true"
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-brand-accent text-white ring-2 ring-brand-accent ring-offset-2'
                    : isCompleted
                    ? 'bg-brand-success text-white'
                    : 'bg-brand-elevated text-brand-secondary border border-brand-border'
                }`}
              >
                {isCompleted ? '✓' : step.num}
              </div>
              <span
                className={`text-xs sm:text-sm truncate ${
                  isActive
                    ? 'text-brand-accent font-bold'
                    : isCompleted
                    ? 'text-brand-text font-semibold'
                    : 'text-brand-secondary font-medium'
                }`}
              >
                {getTranslation(locale, step.key)}
              </span>
            </div>
          );
        })}
      </div>
      <div aria-live="polite" className="sr-only">
        Step {currentStep} of {totalSteps}: {getTranslation(locale, steps[currentStep - 1]?.key || 'step_1_title')}
      </div>
    </nav>
  );
};
