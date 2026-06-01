import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CurriculumService } from "@/services/curriculumService";
import { Card, PageWrapper } from "@/components/Card";
import { Crumbs } from "@/components/Crumbs";

export const Route = createFileRoute("/chapters/$classId/$subject")({
  component: ChaptersPage,
  loader: async ({ params }) => {
    try {
      const classes = await CurriculumService.getClasses();
      const c = classes.find((cls) => cls.id === Number(params.classId));
      if (!c) throw notFound();

      const subjects = await CurriculumService.getSubjects(Number(params.classId));
      const s = subjects.find((sub) => sub.code === params.subject || sub.id === params.subject);
      if (!s) throw notFound();

      const chapters = await CurriculumService.getChapters(s.id);
      return { c, s, chapters };
    } catch {
      throw notFound();
    }
  },
});

function ChaptersPage() {
  const { c, s, chapters } = Route.useLoaderData();
  const chapterCount = chapters.length;

  return (
    <PageWrapper>
      <Crumbs
        items={[
          { label: "Home", to: "/" },
          { label: c.name, to: "/subjects/$classId", params: { classId: String(c.id) } },
          { label: s.name },
        ]}
      />

      <h1 className="text-3xl font-bold mb-2">
        {s.name} <span className="text-muted-foreground text-lg">— Chapters</span>
      </h1>

      <p className="text-muted-foreground mb-8">{chapterCount} chapters available</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {chapters.map((chapter, i) => (
          <Link
            key={chapter.name}
            to="/topics/$classId/$subject/$chapter"
            params={{
              classId: String(c.id),
              subject: s.id,
              chapter: chapter.name,
            }}
          >
            <Card delay={i * 0.02}>
              <div className="text-xs font-bold text-primary mb-2">CHAPTER</div>

              <div className="text-lg font-bold mb-2">{chapter.name}</div>

              <p className="text-xs text-muted-foreground">
                Chapter {i + 1} of {chapters.length}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
}
