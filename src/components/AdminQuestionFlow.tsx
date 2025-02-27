import { useState, useEffect } from "react";
import type { AnalyzedProduct, FlavorProfile } from "@/src/types/types";

interface AdminQuestionFlowProps {
  officialQuestions: FlavorProfile[];
  previewQuestions: FlavorProfile[];
}

export const AdminQuestionFlow: React.FC<AdminQuestionFlowProps> = ({
  officialQuestions,
  previewQuestions
}) => {
  // 表示する質問フローを決定
  const questions = previewQuestions.length > 0 ? previewQuestions : officialQuestions;

  if (questions.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        質問フローはまだ作成されていません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <div key={index} className="border rounded-lg p-4 bg-gray-50">
          <div className="font-medium mb-3">{question.question}</div>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-start gap-2 text-sm">
                <span className="text-gray-600 mt-1">•</span>
                <div className="flex-1">
                  <div>{option.text}</div>
                  {option.nextQuestion && (
                    <span className="text-blue-500">→ {option.nextQuestion}</span>
                  )}
                  {option.result && option.result.length > 0 && (
                    <div className="mt-1 ml-4 text-green-600">
                      → 推薦商品:
                      <ul className="ml-2 list-disc list-inside">
                        {option.result.map((product, productIndex) => (
                          <li key={productIndex} className="text-gray-600">
                            {product.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 