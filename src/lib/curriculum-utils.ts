import { CURRICULUM, type Chapter, type SchoolClass, type Subject, type Topic } from "@/data/curriculum";

export interface CurriculumNode {
  id: number;
  name: string;
  sortOrder: number;
}

export interface CurriculumTopicNode extends CurriculumNode {
  hasSimulation?: boolean;
  simulationRoute?: string;
}

interface IndexedTopic extends Topic {
  numericId: number;
}

interface IndexedChapter extends Chapter {
  numericId: number;
  topics: IndexedTopic[];
}

interface IndexedSubject extends Subject {
  numericId: number;
  chapters: IndexedChapter[];
}

interface IndexedClass extends SchoolClass {
  numericId: number;
  subjects: IndexedSubject[];
}

const indexedCurriculum: IndexedClass[] = [];
const classById = new Map<number, IndexedClass>();
const subjectById = new Map<number, IndexedSubject>();
const chapterById = new Map<number, IndexedChapter>();
const topicById = new Map<number, IndexedTopic>();

let nextId = 1;

function expandChapters(chapters: number | Chapter[]): Chapter[] {
  if (Array.isArray(chapters)) {
    return chapters;
  }

  return Array.from({ length: chapters }, (_, index) => ({
    id: `chapter-${index + 1}`,
    name: `Chapter ${index + 1}`,
    topics: [],
  }));
}

for (const schoolClass of CURRICULUM) {
  const indexedClass: IndexedClass = {
    ...schoolClass,
    numericId: nextId++,
    subjects: [],
  };

  for (const schoolSubject of schoolClass.subjects) {
    const indexedSubject: IndexedSubject = {
      ...schoolSubject,
      numericId: nextId++,
      chapters: [],
    };

    for (const schoolChapter of expandChapters(schoolSubject.chapters)) {
      const indexedChapter: IndexedChapter = {
        ...schoolChapter,
        numericId: nextId++,
        topics: [],
      };

      for (const schoolTopic of schoolChapter.topics) {
        const indexedTopic: IndexedTopic = {
          ...schoolTopic,
          numericId: nextId++,
        };
        indexedChapter.topics.push(indexedTopic);
        topicById.set(indexedTopic.numericId, indexedTopic);
      }

      indexedSubject.chapters.push(indexedChapter);
      chapterById.set(indexedChapter.numericId, indexedChapter);
    }

    indexedClass.subjects.push(indexedSubject);
    subjectById.set(indexedSubject.numericId, indexedSubject);
  }

  indexedCurriculum.push(indexedClass);
  classById.set(indexedClass.numericId, indexedClass);
}

function toNode<T extends { numericId: number; name: string }>(items: T[]): CurriculumNode[] {
  return items.map((item, index) => ({ id: item.numericId, name: item.name, sortOrder: index }));
}

export function getCurriculum(): SchoolClass[] {
  return CURRICULUM;
}

export function getClasses(): CurriculumNode[] {
  return indexedCurriculum.map((schoolClass, index) => ({
    id: schoolClass.numericId,
    name: schoolClass.name,
    sortOrder: index,
  }));
}

export function getSubjects(classId: number): CurriculumNode[] {
  const schoolClass = classById.get(classId) ?? indexedCurriculum.find((item) => item.name === `Class ${classId}`);
  return schoolClass ? toNode(schoolClass.subjects) : [];
}

export function getChapters(classId: number, subjectId: number): CurriculumNode[];
export function getChapters(subjectId: number): CurriculumNode[];
export function getChapters(firstId: number, secondId?: number): CurriculumNode[] {
  if (secondId === undefined) {
    const schoolSubject = subjectById.get(firstId);
    return schoolSubject ? toNode(schoolSubject.chapters) : [];
  }

  const schoolClass = classById.get(firstId) ?? indexedCurriculum.find((item) => item.name === `Class ${firstId}`);
  const schoolSubject = schoolClass?.subjects.find((item) => item.numericId === secondId);
  return schoolSubject ? toNode(schoolSubject.chapters) : [];
}

export function getTopics(chapterId: number): CurriculumTopicNode[];
export function getTopics(classId: number, subjectId: number, chapterId: number): CurriculumTopicNode[];
export function getTopics(firstId: number, secondId?: number, thirdId?: number): CurriculumTopicNode[] {
  if (thirdId === undefined) {
    const schoolChapter = chapterById.get(firstId);
    return schoolChapter
      ? schoolChapter.topics.map((item, index) => ({
          id: item.numericId,
          name: item.name,
          sortOrder: index,
          hasSimulation: item.hasSimulation,
          simulationRoute: item.simulationRoute,
        }))
      : [];
  }

  const schoolClass = classById.get(firstId) ?? indexedCurriculum.find((item) => item.name === `Class ${firstId}`);
  const schoolSubject = schoolClass?.subjects.find((item) => item.numericId === secondId);
  const schoolChapter = schoolSubject?.chapters.find((item) => item.numericId === thirdId);
  return schoolChapter
    ? schoolChapter.topics.map((item, index) => ({
        id: item.numericId,
        name: item.name,
        sortOrder: index,
        hasSimulation: item.hasSimulation,
        simulationRoute: item.simulationRoute,
      }))
    : [];
}

export function findClassByName(name: string): SchoolClass | undefined {
  return CURRICULUM.find((schoolClass) => schoolClass.name === name);
}

export function findSubjectByName(className: string, subjectName: string): Subject | undefined {
  return findClassByName(className)?.subjects.find((subject) => subject.name === subjectName);
}

export function findChapterByName(className: string, subjectName: string, chapterName: string): Chapter | undefined {
  const subject = findSubjectByName(className, subjectName);
  return Array.isArray(subject?.chapters) ? subject.chapters.find((chapter) => chapter.name === chapterName) : undefined;
}

export function findTopicByName(
  className: string,
  subjectName: string,
  chapterName: string,
  topicName: string,
): Topic | undefined {
  return findChapterByName(className, subjectName, chapterName)?.topics.find((topic) => topic.name === topicName);
}

export function getRecommendedTopics(limit = 6): Array<{ className: string; subject: string; chapter: string; topic: string }> {
  const recommendations: Array<{ className: string; subject: string; chapter: string; topic: string }> = [];

  for (const schoolClass of CURRICULUM) {
    for (const schoolSubject of schoolClass.subjects) {
      if (!Array.isArray(schoolSubject.chapters)) {
        continue;
      }

      for (const schoolChapter of schoolSubject.chapters) {
        for (const schoolTopic of schoolChapter.topics) {
          recommendations.push({
            className: schoolClass.name,
            subject: schoolSubject.name,
            chapter: schoolChapter.name,
            topic: schoolTopic.name,
          });
          if (recommendations.length >= limit) {
            return recommendations;
          }
        }
      }
    }
  }

  return recommendations;
}

export function searchCurriculum(query: string): Array<{ kind: "class" | "subject" | "chapter" | "topic"; className: string; subject?: string; chapter?: string; topic?: string; label: string }> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const results: Array<{ kind: "class" | "subject" | "chapter" | "topic"; className: string; subject?: string; chapter?: string; topic?: string; label: string }> = [];

  for (const schoolClass of CURRICULUM) {
    if (schoolClass.name.toLowerCase().includes(normalizedQuery)) {
      results.push({ kind: "class", className: schoolClass.name, label: schoolClass.name });
    }

    for (const schoolSubject of schoolClass.subjects) {
      if (schoolSubject.name.toLowerCase().includes(normalizedQuery)) {
        results.push({ kind: "subject", className: schoolClass.name, subject: schoolSubject.name, label: `${schoolClass.name} · ${schoolSubject.name}` });
      }

      if (!Array.isArray(schoolSubject.chapters)) {
        continue;
      }

      for (const schoolChapter of schoolSubject.chapters) {
        if (schoolChapter.name.toLowerCase().includes(normalizedQuery)) {
          results.push({
            kind: "chapter",
            className: schoolClass.name,
            subject: schoolSubject.name,
            chapter: schoolChapter.name,
            label: `${schoolClass.name} · ${schoolSubject.name} · ${schoolChapter.name}`,
          });
        }

        for (const schoolTopic of schoolChapter.topics) {
          if (schoolTopic.name.toLowerCase().includes(normalizedQuery)) {
            results.push({
              kind: "topic",
              className: schoolClass.name,
              subject: schoolSubject.name,
              chapter: schoolChapter.name,
              topic: schoolTopic.name,
              label: `${schoolClass.name} · ${schoolSubject.name} · ${schoolChapter.name} · ${schoolTopic.name}`,
            });
          }
        }
      }
    }
  }

  return results.slice(0, 20);
}
