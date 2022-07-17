export async function importRelative(metaUrl: string, file: string) {
  const directory = metaUrl.substring(0, metaUrl.lastIndexOf('/') + 1);
  const url = directory + file;
  const response = await fetch(url, { cache: 'no-cache', mode: 'same-origin' });
  return await response.text();
}

export async function importCss(metaUrl: string, file: string) {
  const text = await importRelative(metaUrl, file);
  const style = document.createElement('style');
  style.innerHTML = text;
  return style;
}

export async function importHtml(metaUrl: string, file: string) {
  const text = await importRelative(metaUrl, file);
  const template = document.createElement('template');
  template.innerHTML = text;

  return template.content;
}
