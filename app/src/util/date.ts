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

export function parseDate(str: string) {
  const match = /(\d{4})\-(\d{1,2})\-(\d{1,2})/.exec(str);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  } else {
    return new Date();
  }
}

export function toGoDateString(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function toDateString(date: Date) {
  return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
}

export function toLongDateString(date: Date) {
  return date.toLocaleDateString(undefined, {  dateStyle: 'full' });
}
