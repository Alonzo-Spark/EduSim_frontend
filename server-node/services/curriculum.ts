import type { PoolClient } from "pg";
import { query } from "../db/db.js";

export interface CurriculumNameInput {
  className?: string | null;
  subject?: string | null;
  chapter?: string | null;
  topic?: string | null;
}

export interface CurriculumIds {
  classId: number | null;
  subjectId: number | null;
  chapterId: number | null;
  topicId: number | null;
}

function clean(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized : null;
}

async function upsertClass(client: PoolClient, className: string): Promise<number> {
  const result = await client.query<{ id: number }>(
    `
      INSERT INTO classes (name, sort_order)
      VALUES ($1, 0)
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `,
    [className],
  );
  return result.rows[0]!.id;
}

async function upsertSubject(
  client: PoolClient,
  classId: number,
  subject: string,
): Promise<number> {
  const result = await client.query<{ id: number }>(
    `
      INSERT INTO subjects (class_id, name, sort_order)
      VALUES ($1, $2, 0)
      ON CONFLICT (class_id, name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `,
    [classId, subject],
  );
  return result.rows[0]!.id;
}

async function upsertChapter(
  client: PoolClient,
  subjectId: number,
  chapter: string,
): Promise<number> {
  const result = await client.query<{ id: number }>(
    `
      INSERT INTO chapters (subject_id, name, sort_order)
      VALUES ($1, $2, 0)
      ON CONFLICT (subject_id, name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `,
    [subjectId, chapter],
  );
  return result.rows[0]!.id;
}

async function upsertTopic(client: PoolClient, chapterId: number, topic: string): Promise<number> {
  const result = await client.query<{ id: number }>(
    `
      INSERT INTO topics (chapter_id, name, sort_order)
      VALUES ($1, $2, 0)
      ON CONFLICT (chapter_id, name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `,
    [chapterId, topic],
  );
  return result.rows[0]!.id;
}

export async function resolveOrCreateCurriculumIds(
  client: PoolClient,
  input: CurriculumNameInput,
): Promise<CurriculumIds> {
  const className = clean(input.className);
  const subject = clean(input.subject);
  const chapter = clean(input.chapter);
  const topic = clean(input.topic);

  let classId: number | null = null;
  let subjectId: number | null = null;
  let chapterId: number | null = null;
  let topicId: number | null = null;

  if (className) {
    classId = await upsertClass(client, className);
  }

  if (classId && subject) {
    subjectId = await upsertSubject(client, classId, subject);
  }

  if (subjectId && chapter) {
    chapterId = await upsertChapter(client, subjectId, chapter);
  }

  if (chapterId && topic) {
    topicId = await upsertTopic(client, chapterId, topic);
  }

  return { classId, subjectId, chapterId, topicId };
}

export async function getClasses(): Promise<
  Array<{ id: number; name: string; sortOrder: number }>
> {
  const result = await query<{ id: number; name: string; sort_order: number }>(
    `
      SELECT id, name, sort_order
      FROM classes
      ORDER BY sort_order ASC, name ASC
    `,
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function getSubjects(
  classId: number,
): Promise<Array<{ id: number; name: string; sortOrder: number }>> {
  const result = await query<{ id: number; name: string; sort_order: number }>(
    `
      SELECT id, name, sort_order
      FROM subjects
      WHERE class_id = $1
      ORDER BY sort_order ASC, name ASC
    `,
    [classId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function getChapters(
  subjectId: number,
): Promise<Array<{ id: number; name: string; sortOrder: number }>> {
  const result = await query<{ id: number; name: string; sort_order: number }>(
    `
      SELECT id, name, sort_order
      FROM chapters
      WHERE subject_id = $1
      ORDER BY sort_order ASC, name ASC
    `,
    [subjectId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function getTopics(
  chapterId: number,
): Promise<Array<{ id: number; name: string; sortOrder: number }>> {
  const result = await query<{ id: number; name: string; sort_order: number }>(
    `
      SELECT id, name, sort_order
      FROM topics
      WHERE chapter_id = $1
      ORDER BY sort_order ASC, name ASC
    `,
    [chapterId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}
