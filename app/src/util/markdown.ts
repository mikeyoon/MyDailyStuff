export function toHtml(markdown: string) {
  return markdown.replace('<', '&lt;').replace('>', '&gt;').replace(/\n/g, '<br />');
}