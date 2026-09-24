"use client";

import { CopyButton } from "./copy-button";
import { SaveLearningButton } from "./save-learning-button";

export type VocabularyUpgradeItem = {
  originalExpression: string;
  upgradedExpression: string;
  meaningVi: string;
};

type VocabularyUpgradesTableProps = {
  submissionId: string;
  upgrades: VocabularyUpgradeItem[];
};

export function VocabularyUpgradesTable({
  submissionId,
  upgrades,
}: VocabularyUpgradesTableProps) {
  if (!upgrades || upgrades.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="w-12 py-3.5 pl-4 text-center">#</th>
              <th className="w-[28%] min-w-[200px] py-3.5 px-3">Từ / Cụm gốc của bạn</th>
              <th className="w-[34%] min-w-[240px] py-3.5 px-3">Gợi ý nâng cấp tự nhiên</th>
              <th className="w-[26%] min-w-[180px] py-3.5 px-3">Giải nghĩa tiếng Việt</th>
              <th className="min-w-[130px] py-3.5 pr-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {upgrades.map((item, index) => (
              <tr
                key={index}
                className="transition-colors hover:bg-slate-50/70 align-top"
              >
                {/* Index */}
                <td className="py-4 pl-4 text-center">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-700 border border-sky-100">
                    {index + 1}
                  </span>
                </td>

                {/* Từ gốc */}
                <td className="py-4 px-3">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-700">
                    <span className="line-through decoration-slate-400 font-medium">
                      {item.originalExpression}
                    </span>
                  </div>
                </td>

                {/* Gợi ý nâng cấp */}
                <td className="py-4 px-3">
                  <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/70 to-blue-50/30 p-3">
                    <p className="font-heading font-bold text-slate-900 text-sm leading-relaxed text-sky-950">
                      {item.upgradedExpression}
                    </p>
                  </div>
                </td>

                {/* Giải nghĩa */}
                <td className="py-4 px-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 border border-slate-100">
                    <span>{item.meaningVi}</span>
                  </div>
                </td>

                {/* Thao tác */}
                <td className="py-4 pr-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap pt-1">
                    <CopyButton
                      textToCopy={item.upgradedExpression}
                      label="Chép"
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                    />
                    <SaveLearningButton
                      submissionId={submissionId}
                      sourceType="VOCABULARY"
                      sourceIndex={index}
                      label="Lưu"
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
