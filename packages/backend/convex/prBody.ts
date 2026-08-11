type PrSection = { heading: string; content: string };

/** Builds the Task / Change Requests sections used in task PR bodies.
 * Shared between the workflow's auto PR step and the manual Create PR action
 * so both produce identical output. */
export function buildTaskPrSections(
  taskDescription: string | undefined,
  changeRequests: string[],
): PrSection[] {
  const sections: PrSection[] = [
    {
      heading: "Task",
      content: taskDescription ?? "No description",
    },
  ];

  if (changeRequests.length > 0) {
    sections.push({
      heading: "Change Requests",
      content: changeRequests.map((cr, i) => `${i + 1}. ${cr}`).join("\n"),
    });
  }

  return sections;
}

/** Builds the Project / Tasks sections used in project PR bodies. Listed
 * tasks are those that have at least one successful run on the project
 * branch — i.e. tasks that have actually contributed commits. */
export function buildProjectPrSections(
  projectTitle: string,
  projectDescription: string | undefined,
  completedTasks: Array<{ title: string; description: string | undefined }>,
): PrSection[] {
  const sections: PrSection[] = [
    {
      heading: "Project",
      content: projectDescription
        ? `**${projectTitle}**\n\n${projectDescription}`
        : `**${projectTitle}**`,
    },
  ];

  if (completedTasks.length > 0) {
    const lines = completedTasks.map((t, i) =>
      t.description
        ? `${i + 1}. **${t.title}** — ${t.description}`
        : `${i + 1}. **${t.title}**`,
    );
    sections.push({
      heading: "Completed Tasks",
      content: lines.join("\n"),
    });
  }

  return sections;
}

/** Assembles a pull request body from an array of heading/content sections. */
export function buildPrBody(sections: PrSection[], evaUrl?: string): string {
  const parts: string[] = [];
  for (const section of sections) {
    parts.push(`## ${section.heading}`);
    parts.push(section.content);
    parts.push("");
  }
  parts.push("---");
  if (evaUrl) {
    parts.push(`[View in Eva](${evaUrl}) | *Created by Eva*`);
  } else {
    parts.push("*Created by Eva*");
  }
  return parts.join("\n");
}
