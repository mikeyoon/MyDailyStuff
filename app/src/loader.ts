export async function importRelative(metaUrl: string, file: string) {
  const url = new URL(file, metaUrl);
  // TODO: ETags
  const response = await fetch(url, { cache: window.ENV === 'production' ? "default" : 'no-cache', mode: 'same-origin' });
  return await response.text();
}

export async function importCss(metaUrl: string, file: string) {
  const text = await importRelative(metaUrl, file);
  const style = document.createElement('style');
  style.textContent = text;
  return style;
}

export async function importHtml(metaUrl: string, file: string) {
  const text = await importRelative(metaUrl, file);
  const template = document.createElement('template');
  template.innerHTML = text;

  return template.content;
}

export async function importCssAndHtml(metaUrl: string, name: string) {
  return await Promise.all([importCss(metaUrl, `${name}.css`), importHtml(metaUrl, `${name}.html`)]);
}
