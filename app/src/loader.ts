export async function importRelative(metaUrl: string, file: string) {
  const directory = metaUrl.substring(0, metaUrl.lastIndexOf('/') + 1);
  const url = directory + file;
  // TODO: ETags
  const response = await fetch(url, { cache: window.ENV === 'production' ? "default" : 'no-cache', mode: 'same-origin' });
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

export async function importCssAndHtml(metaUrl: string, name: string) {
  return await Promise.all([importCss(metaUrl, name + '.css'), importHtml(metaUrl, `${name}.html`)]);
}
