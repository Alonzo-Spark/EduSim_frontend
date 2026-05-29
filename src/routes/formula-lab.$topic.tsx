import { createFileRoute } from "@tanstack/react-router";
import FormulaLabPage from "@/components/formula-lab/FormulaLabPage";

export const Route = createFileRoute("/formula-lab/$topic")({
  validateSearch: (search: Record<string, unknown>) => ({
    classId: typeof search.classId === "string" ? search.classId : undefined,
    subject: typeof search.subject === "string" ? search.subject : undefined,
    chapter: typeof search.chapter === "string" ? search.chapter : undefined,
    tab:
      search.tab === "anatomy" ||
      search.tab === "solve" ||
      search.tab === "visualize" ||
      search.tab === "practice"
        ? search.tab
        : undefined,
  }),
  component: FormulaLabRoute,
});

function FormulaLabRoute() {
  const { topic } = Route.useParams();
  const search = Route.useSearch();

  return (
    <FormulaLabPage
      topic={topic || "Topic"}
      classId={search.classId}
      subject={search.subject}
      chapter={search.chapter}
      initialTab={search.tab}
    />
  );
}
