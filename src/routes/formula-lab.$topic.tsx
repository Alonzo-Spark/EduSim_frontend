import React from "react";
import FormulaLabPage from "@/components/formula-lab/FormulaLabPage";
import { useParams } from "@tanstack/react-router";

export default function FormulaLabRoute() {
  const params = useParams() as any;
  const topic = params.topic || 'Topic';
  const classId = params.classId;
  const subject = params.subject;

  return <FormulaLabPage topic={topic} classId={classId} subject={subject} />;
}
