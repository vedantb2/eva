"use client";

import { use } from "react";
import { codeToHtml } from "shiki";

const cache = new Map<string, Promise<string>>();

function highlight(code: string, language: string): Promise<string> {
  const key = `${language}:${code}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const promise = codeToHtml(code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
  });
  cache.set(key, promise);
  return promise;
}

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const html = use(highlight(code, language));

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className="text-xs [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:m-0 [&_pre]:overflow-x-auto [&_code]:whitespace-pre-wrap [&_code]:break-words"
    />
  );
}
