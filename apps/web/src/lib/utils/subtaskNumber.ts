export function formatSubtaskNumber(
  parentTaskNumber: number,
  subtaskOrder: number,
): string {
  return `${parentTaskNumber}.${subtaskOrder + 1}`;
}
