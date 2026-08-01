import { use } from "react";

const cache = new Map<string, Promise<string>>();

async function highlight(code: string, language: string): Promise<string> {
  const key = `${language}:${code}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { codeToHtml } = await import("shiki");
  const themes = { light: "github-light", dark: "github-dark" } as const;
  // Shiki throws on an unknown language grammar; fall back to plain text so the
  // viewer never crashes on an extension we have not mapped.
  const promise = codeToHtml(code, { lang: language, themes }).catch(() =>
    codeToHtml(code, { lang: "text", themes }),
  );
  cache.set(key, promise);
  return promise;
}

export function LazyCodeBlock({
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
      className="text-xs [&_pre]:p-3 [&_pre]:m-0 [&_pre]:overflow-x-auto [&_code]:whitespace-pre-wrap [&_code]:break-words"
    />
  );
}
