"use client";

import { ChevronDown, PlayCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { hasFlatCapability } from "@/lib/auth/capabilities";
import type { OrganizationDto } from "@/services/organizations/types";
import {
  PRODUCTION_STAGE_LABELS,
  SELECTABLE_PRODUCTION_STAGES,
  useSetProductionStage,
  useStartLabelDesign,
  type ProductionStage,
} from "@/services/formulations";


export function ProductionControls({
  organization,
  formulationId,
  currentStage,
}: {
  organization: OrganizationDto;
  formulationId: string;
  currentStage: ProductionStage;
}) {
  const canEdit = hasFlatCapability(organization, "formulations", "edit");
  if (!canEdit) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ProductionStageDropdown
        orgId={organization.id}
        formulationId={formulationId}
        currentStage={currentStage}
      />
      <StartLabelDesignButton
        orgId={organization.id}
        formulationId={formulationId}
      />
    </div>
  );
}


function ProductionStageDropdown({
  orgId,
  formulationId,
  currentStage,
}: {
  orgId: string;
  formulationId: string;
  currentStage: ProductionStage;
}) {
  const [open, setOpen] = useState(false);
  const mutation = useSetProductionStage(orgId, formulationId);

  const handleSelect = (stage: ProductionStage) => {
    setOpen(false);
    if (stage !== currentStage) {
      mutation.mutate(stage);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-ink-0 px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50 disabled:opacity-60"
      >
        <span>
          {PRODUCTION_STAGE_LABELS[currentStage]}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-xl border border-ink-200 bg-ink-0 py-1 shadow-lg">
            {SELECTABLE_PRODUCTION_STAGES.map((stage) => (
              <li key={stage}>
                <button
                  type="button"
                  onClick={() => handleSelect(stage)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-ink-50 ${
                    stage === currentStage
                      ? "font-semibold text-ink-900"
                      : "text-ink-700"
                  }`}
                >
                  {PRODUCTION_STAGE_LABELS[stage]}
                </button>
              </li>
            ))}
            {currentStage !== "not_started" && (
              <>
                <li className="mx-3 my-1 border-t border-ink-100" />
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelect("not_started")}
                    className="w-full px-4 py-2 text-left text-sm text-ink-400 hover:bg-ink-50"
                  >
                    Reset to automated
                  </button>
                </li>
              </>
            )}
          </ul>
        </>
      )}
    </div>
  );
}


function StartLabelDesignButton({
  orgId,
  formulationId,
}: {
  orgId: string;
  formulationId: string;
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const mutation = useStartLabelDesign(orgId, formulationId);

  const handleClick = () => {
    mutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.label_design_id) {
          router.push(`/${locale}/labelling/${data.label_design_id}`);
        }
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={mutation.isPending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-ink-0 shadow-sm hover:bg-orange-600 disabled:opacity-60"
    >
      <PlayCircle className="h-3.5 w-3.5" />
      {mutation.isPending ? "Starting…" : "Start label design"}
    </button>
  );
}
