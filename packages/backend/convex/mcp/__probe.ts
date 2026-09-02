import { z } from "zod";
import { defineTool } from "./registry";

const t = defineTool({
  name: "x",
  description: "y",
  mutating: false,
  input: {
    a: z.string(),
    b: z.number().default(3),
    c: z.string().optional(),
    d: z.enum(["p", "q"]).optional(),
  },
  handler: async ({ a, b, c, d }) => {
    const rest: string = a + String(b) + (c ?? "") + (d ?? "");
    return { content: [{ type: "text" as const, text: rest }] };
  },
});
const t2 = defineTool({
  name: "z", description: "y", mutating: true, input: {},
  handler: async () => ({ content: [{ type: "text" as const, text: "ok" }], isError: true }),
});
console.log(t.name, t2.name);
