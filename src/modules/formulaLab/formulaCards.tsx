import React from 'react'

interface Formula {
  title: string
  latex: string
  variables: string[]
  intuition: string
}

interface FormulaCardsProps {
  formulas: Formula[]
}

export const FormulaCards: React.FC<FormulaCardsProps> = ({ formulas }) => {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      {formulas.map((formula, idx) => (
        <div
          key={idx}
          className="flex-1 min-w-[280px] p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl transition-all hover:scale-[1.02]"
        >
          <h4 className="text-sm font-semibold text-sky-400 mb-2">{formula.title}</h4>
          <div className="py-4 text-center bg-black/20 rounded-lg mb-3">
            <code className="text-lg text-white font-mono">{formula.latex}</code>
          </div>
          <p className="text-xs text-white/60 leading-relaxed mb-3">{formula.intuition}</p>
          <div className="flex flex-wrap gap-1">
            {formula.variables.map((variable, vIdx) => (
              <span
                key={vIdx}
                className="px-2 py-0.5 text-[10px] rounded bg-white/10 text-white/80"
              >
                {variable}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
