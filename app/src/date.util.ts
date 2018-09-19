export function readAsUtcDate(localDate: Date) {
  return new Date(
    Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
  );
}

export function readAsUtcMonth(localDate: Date) {
  return new Date(
    Date.UTC(localDate.getFullYear(), localDate.getMonth())
  );
}
