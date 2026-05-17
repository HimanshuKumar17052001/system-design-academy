import { modules } from "@/data/curriculum";
import type { Module, Lesson } from "@/types/curriculum";

export interface SearchResult {
  moduleId: string;
  moduleTitle: string;
  moduleNumber: number;
  lessonId?: string;
  lessonTitle?: string;
  type: "module" | "lesson";
  excerpt: string;
  category: string;
}

export function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  modules.forEach((module) => {
    results.push({
      moduleId: module.id,
      moduleTitle: module.title,
      moduleNumber: module.number,
      type: "module",
      excerpt: module.subtitle,
      category: module.category,
    });

    module.lessons?.forEach((lesson) => {
      const contentText = lesson.content
        .map((block) => {
          if (block.type === "text") return block.content;
          if (block.type === "bullets") return block.items.join(" ");
          if (block.type === "callout") return block.content;
          if (block.type === "table") {
            return (
              block.headers.join(" ") +
              " " +
              block.rows.flat().join(" ")
            );
          }
          return "";
        })
        .join(" ")
        .slice(0, 200);

      results.push({
        moduleId: module.id,
        moduleTitle: module.title,
        moduleNumber: module.number,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        type: "lesson",
        excerpt: contentText,
        category: module.category,
      });
    });
  });

  return results;
}

export function searchContent(query: string, limit = 10): SearchResult[] {
  if (!query.trim()) return [];

  const index = buildSearchIndex();
  const queryLower = query.toLowerCase();

  const scored = index.map((item) => {
    let score = 0;
    const searchableText = [
      item.moduleTitle,
      item.moduleNumber.toString(),
      item.lessonTitle || "",
      item.excerpt,
      item.category,
    ]
      .join(" ")
      .toLowerCase();

    if (searchableText.includes(queryLower)) {
      score += 10;
    }

    const queryWords = queryLower.split(/\s+/);
    queryWords.forEach((word) => {
      if (word.length < 2) return;
      if (item.moduleTitle.toLowerCase().includes(word)) score += 5;
      if (item.lessonTitle?.toLowerCase().includes(word)) score += 3;
      if (item.excerpt.toLowerCase().includes(word)) score += 1;
    });

    if (item.type === "module") score += 2;

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}