import React from "react";
import {
  IntroductionSection,
  DefinitionSection,
  KeyConceptsSection,
  PropertiesSection,
  FormulaSection,
  DerivationSection,
  SolvedExampleSection,
  ApplicationsSection,
  SummarySection,
  SuggestedQuestionsSection
} from "./StructuredSections";
import { FormulaLabCard } from "./FormulaLabCard";
import { TutorAnalysisResponse } from "@/services/TutorService";

interface Props {
  structured: NonNullable<TutorAnalysisResponse["data"]["structured"]>;
}

export function TopicPageRenderer({ structured }: Props) {
  return (
    <div className="w-full flex flex-col space-y-2">
      <IntroductionSection content={structured.introduction} />
      <DefinitionSection content={structured.definition} />
      <KeyConceptsSection items={structured.keyConcepts} />
      <PropertiesSection items={structured.properties} />
      <FormulaSection formula={structured.formula} />
      <DerivationSection content={structured.derivation} />
      <SolvedExampleSection content={structured.solvedExample} />
      <ApplicationsSection items={structured.applications} />
      <SummarySection content={structured.summary} />
      <SuggestedQuestionsSection items={structured.suggestedQuestions} />

      {/* Formula Lab Card injected at the end of the topic if formula exists */}
      <FormulaLabCard formula={structured.formula} />
    </div>
  );
}
