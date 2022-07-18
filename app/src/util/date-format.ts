export function toGoDateString(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function toDateString(date: Date) {
  return `${date.getMonth()}-${date.getDay()}-${date.getFullYear()}`;
}

export function toLongDateString(date: Date) {
  return date.toLocaleDateString(undefined, {  dateStyle: 'full' });
}
