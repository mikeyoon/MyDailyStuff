export function toGoDateString(utcDate: Date) {
  return `${utcDate.getUTCFullYear()}-${utcDate.getUTCMonth() + 1}-${utcDate.getUTCDate()}`;
}

export function toDateString(utcDate: Date) {
  return `${utcDate.getUTCMonth()}-${utcDate.getUTCDate()}-${utcDate.getUTCFullYear()}`;
}

export function toLongDateString(utcDate: Date) {
  return utcDate.toLocaleDateString(undefined, {  dateStyle: 'full', timeZone: 'utc' });
}
