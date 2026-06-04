import { createFileRoute, useNavigate, notFound, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CurriculumService } from "@/services/curriculumService";
import { PageWrapper } from "@/components/Card";
import { Crumbs } from "@/components/Crumbs";
import { Brain, Play } from "lucide-react";

export const Route = createFileRoute("/topics/$classId/$subject/$chapter")({
  beforeLoad: ({ params }) => {
    if (
      params.classId === "9" &&
      params.subject === "physics" &&
      params.chapter.toUpperCase() === "LAWS OF MOTION"
    ) {
      throw redirect({
        to: "/simulation/class9/physics/laws-of-motion",
      });
    }
  },
  component: TopicsPage,
  loader: async ({ params }) => {
    try {
      const classes = await CurriculumService.getClasses();
      const c = classes.find((cls) => cls.id === Number(params.classId));
      if (!c) throw notFound();

      const subjects = await CurriculumService.getSubjects(Number(params.classId));
      const s = subjects.find((sub) => sub.code === params.subject || sub.id === params.subject);
      if (!s) throw notFound();

      const chapters = await CurriculumService.getChapters(s.id, Number(params.classId));
      const chapter = chapters.find((ch) => ch.name === params.chapter);
      if (!chapter) throw notFound();

      const topics = await CurriculumService.getTopics(chapter.id, Number(params.classId));
      return { c, s, chapter: { ...chapter, topics }, classId: params.classId, subjectId: params.subject };
    } catch {
      throw notFound();
    }
  },
});

function TopicsPage() {
  const { c, s, chapter, classId, subjectId } = Route.useLoaderData();
  const navigate = useNavigate();

  const handleAskTutor = (topic: any) => {
    navigate({
      to: "/tutor",
      search: {
        subject: s.name,
        class_name: c.name,
        chapter: chapter.name,
        topic: topic.name,
        prompt: `Explain "${topic.name}" from the chapter "${chapter.name}" in ${s.name} for ${c.name}.`,
      } as any,
    });
  };

  return (
    <PageWrapper>
      <Crumbs
        items={[
          { label: "Home", to: "/" },
          { label: c.name, to: "/subjects/$classId", params: { classId: String(c.id) } },
          {
            label: s.name,
            to: "/chapters/$classId/$subject",
            params: { classId: String(c.id), subject: s.id },
          },
          { label: chapter.name },
        ]}
      />

      <h1 className="text-3xl font-bold mb-2">
        {chapter.name} <span className="text-muted-foreground text-lg font-normal">— Topics</span>
      </h1>

      <p className="text-muted-foreground mb-8">{chapter.topics.length} topics available</p>

      <div className="space-y-3">
        {chapter.topics.map((topic, i) => (
          <motion.div
            key={topic.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-mono text-sm text-primary font-bold">
                {String(i + 1).padStart(2, "0")}
              </div>

              <div>
                <h3 className="font-semibold">{topic.name}</h3>

                <p className="text-xs text-muted-foreground">
                  {topic.has_simulation ? "Premium simulation available" : "Theory topic"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {topic.has_simulation && topic.simulation_route ? (
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    navigate({
                      to: topic.simulation_route || undefined,
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary text-foreground text-sm font-bold border border-border hover:bg-secondary/80 transition-all"
                >
                  <Play className="w-4 h-4 text-primary" /> Lab
                </motion.button>
              ) : null}

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAskTutor(topic)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-all"
              >
                <Brain className="w-4 h-4" /> Ask AI Tutor
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </PageWrapper>
  );
}
