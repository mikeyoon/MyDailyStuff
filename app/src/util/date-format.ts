export function toGoDateString(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
}

export function toDateString(date: Date) {
  return `${date.getMonth()}-${date.getDay()}-${date.getFullYear()}`;
}
