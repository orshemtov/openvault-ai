export function truncateSelection(selection: string, maxLength = 180): string {
  if (selection.length <= maxLength) {
    return selection;
  }

  return `${selection.slice(0, maxLength - 3)}...`;
}
