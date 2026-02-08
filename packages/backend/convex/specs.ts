import { action } from "./_generated/server";
import { v } from "convex/values";

export const generateSpec = action({
  args: {
    description: v.string(),
  },
  returns: v.object({
    title: v.string(),
    description: v.string(),
    subtasks: v.array(v.string()),
  }),
  handler: async (_, args) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return generateMockSpec(args.description);
    }

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a product manager assistant. Given a feature description, generate a structured spec with:
1. A clear, concise title (max 60 chars)
2. A detailed description explaining the feature
3. A list of 3-6 subtasks to implement the feature

Respond in JSON format:
{
  "title": "Feature title",
  "description": "Detailed description...",
  "subtasks": ["Subtask 1", "Subtask 2", ...]
}`,
              },
              {
                role: "user",
                content: args.description,
              },
            ],
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response from AI");
      }

      const spec = JSON.parse(content);
      return {
        title: String(spec.title || "New Feature"),
        description: String(spec.description || args.description),
        subtasks: Array.isArray(spec.subtasks)
          ? spec.subtasks.map((s: unknown) => String(s))
          : [],
      };
    } catch (error) {
      console.error("AI spec generation failed:", error);
      return generateMockSpec(args.description);
    }
  },
});

function generateMockSpec(description: string): {
  title: string;
  description: string;
  subtasks: string[];
} {
  const words = description.split(" ").slice(0, 5).join(" ");
  const title = words.length > 50 ? words.slice(0, 47) + "..." : words;

  return {
    title: title || "New Feature",
    description: description,
    subtasks: [
      "Define requirements and acceptance criteria",
      "Implement core functionality",
      "Add unit tests",
      "Update documentation",
      "Review and deploy",
    ],
  };
}
