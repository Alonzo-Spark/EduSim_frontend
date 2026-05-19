export interface CurriculumNode {
  id: number;
  name: string;
  sortOrder: number;
}

export interface TutorCitation {
  citationNumber: number;
  id: number;
  classId: number | null;
  subjectId: number | null;
  chapterId: number | null;
  topicId: number | null;
  className: string | null;
  subject: string | null;
  chapter: string | null;
  topic: string | null;
  sourceFile: string;
  page: number;
  semanticScore: number;
  keywordScore: number;
  score: number;
  excerpt: string;
}

export interface TutorMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: TutorCitation[];
  retrievalMetadata: Record<string, unknown> | null;
  createdAt: string;
}

import { API_BASE_URL } from "../config/api";
import {
  getClasses as getLocalClasses,
  getSubjects as getLocalSubjects,
  getChapters as getLocalChapters,
  getTopics as getLocalTopics,
} from "./curriculum-utils";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() || API_BASE_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}) as Record<string, unknown>);
  if (!response.ok) {
    const errorMessage =
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload as T;
}

async function safeRequest<T>(path: string, init?: RequestInit, fallback: T): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    console.warn(`[tutor-api] request failed for ${path}`, error);
    return fallback;
  }
}

export function getOrCreateTutorSessionId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const storageKey = "edusim:tutor-session-id";
  const existing = localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  localStorage.setItem(storageKey, next);
  return next;
}

export async function getClasses(): Promise<CurriculumNode[]> {
  const localFallback = getLocalClasses();
  const payload = await safeRequest<{ classes: CurriculumNode[] }>("/api/classes", undefined, { classes: localFallback });
  return Array.isArray(payload.classes) && payload.classes.length > 0 ? payload.classes : localFallback;
}

export async function getSubjects(classId: number): Promise<CurriculumNode[]> {
  const localFallback = getLocalSubjects(classId);
  const payload = await safeRequest<{ subjects: CurriculumNode[] }>(`/api/subjects/${classId}`, undefined, { subjects: localFallback });
  return Array.isArray(payload.subjects) && payload.subjects.length > 0 ? payload.subjects : localFallback;
}

export async function getChapters(subjectId: number): Promise<CurriculumNode[]> {
  const localFallback = getLocalChapters(subjectId);
  const payload = await safeRequest<{ chapters: CurriculumNode[] }>(`/api/chapters/${subjectId}`, undefined, { chapters: localFallback });
  return Array.isArray(payload.chapters) && payload.chapters.length > 0 ? payload.chapters : localFallback;
}

export async function getTopics(chapterId: number): Promise<CurriculumNode[]> {
  const localFallback = getLocalTopics(chapterId);
  const payload = await safeRequest<{ topics: CurriculumNode[] }>(`/api/topics/${chapterId}`, undefined, { topics: localFallback });
  return Array.isArray(payload.topics) && payload.topics.length > 0 ? payload.topics : localFallback;
}

export async function sendTutorMessage(input: {
  message: string;
  topic: string;
  class_name: string;
  subject: string;
  chapter?: string;
  chat_history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ response: string; answer: string; citations: TutorCitation[]; retrieved_chunks: TutorCitation[] }> {
  const payload = await request<{ response?: string; answer?: string; citations?: TutorCitation[]; retrieved_chunks?: TutorCitation[] }>("/api/tutor/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const citations = Array.isArray(payload.retrieved_chunks)
    ? payload.retrieved_chunks
    : Array.isArray(payload.citations)
      ? payload.citations
      : [];

  return {
    answer: payload.answer || payload.response || "No response received.",
    response: payload.response || payload.answer || "No response received.",
    citations,
    retrieved_chunks: citations,
  };
}

export const listClasses = getClasses;
export const listSubjects = getSubjects;
export const listChapters = getChapters;
export const listTopics = getTopics;
