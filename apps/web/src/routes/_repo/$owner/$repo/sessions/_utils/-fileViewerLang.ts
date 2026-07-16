// Maps a file path to a Shiki language id for the File Viewer. Shiki throws on
// an unrecognised language, so anything unmapped falls back to "text" (its
// built-in plain grammar). LazyCodeBlock also guards with a runtime fallback.

const EXTENSION_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "jsonc",
  md: "markdown",
  mdx: "mdx",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  html: "html",
  vue: "vue",
  svelte: "svelte",
  astro: "astro",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  ini: "ini",
  sql: "sql",
  graphql: "graphql",
  gql: "graphql",
  prisma: "prisma",
  xml: "xml",
  svg: "xml",
  proto: "proto",
  dart: "dart",
  lua: "lua",
  r: "r",
};

const FILENAME_TO_LANG: Record<string, string> = {
  dockerfile: "docker",
  makefile: "make",
  ".gitignore": "text",
  ".env": "dotenv",
};

/** Returns the Shiki language id for a file path, defaulting to "text". */
export function shikiLangForPath(path: string): string {
  const name = path.replace(/\\/g, "/").split("/").pop()?.toLowerCase() ?? "";
  const byName = FILENAME_TO_LANG[name];
  if (byName) return byName;
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "text";
  return EXTENSION_TO_LANG[name.slice(dot + 1)] ?? "text";
}
