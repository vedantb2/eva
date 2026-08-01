import { describe, expect, test } from "vitest";
import { sanitizeCursorConfigOptions } from "../providers/cursorAcpCapabilities.js";

describe("sanitizeCursorConfigOptions", () => {
  test("flattens select groups and preserves supported boolean options", () => {
    expect(
      sanitizeCursorConfigOptions([
        {
          type: "select",
          id: "reasoning",
          name: "Reasoning",
          currentValue: "high",
          options: [
            {
              group: "effort",
              name: "Effort",
              options: [
                { value: "low", name: "Low" },
                { value: "high", name: "High" },
              ],
            },
          ],
        },
        {
          type: "boolean",
          id: "thinking",
          name: "Thinking",
          currentValue: false,
        },
      ]),
    ).toEqual([
      {
        type: "select",
        id: "reasoning",
        name: "Reasoning",
        currentValue: "high",
        options: [
          { value: "low", name: "Low" },
          { value: "high", name: "High" },
        ],
      },
      {
        type: "boolean",
        id: "thinking",
        name: "Thinking",
        currentValue: false,
      },
    ]);
  });
});
