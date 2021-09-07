import * as Directives from './directives.js';

const DIRECTIVE_SELECTOR = [
  '[\\[if\\]]',
  '[\\[content\\]]',
  '[\\[class\\]]',
  '[\\[classes\\]]',
  '[\\[click\\]]',
  '[\\[submit\\]]',
  '[\\[change\\]]',
  '[\\[input\\]]',
  '[\\[keypress\\]]',
  '[\\[blur\\]]',
  '[\\[focus\\]]',
].join(',');

const TEMPLATED_DIRECTIVE_SELECTOR = [
  '[\\[repeat\\]]',
].join(',');

export class CompiledElement {
  private digestTimeout: number | null = null;

  constructor(private html: DocumentFragment, private compiledDirectives: Directives.CompiledDirective[]) {
  }

  digest(context: any) {
    if (!this.digestTimeout) {
      this.digestTimeout = window.setTimeout(() => {
        this.digestTimeout = null;

        this.compiledDirectives.forEach((c) => {
          c.execute(context);
        });
      }, 10);
    }
  }
}

export function compileFragment(html: DocumentFragment, root: Element) {
  const compiled: Directives.CompiledDirective[] = [];

  // const templated = html.querySelectorAll(TEMPLATED_DIRECTIVE_SELECTOR);
  // templated.forEach((element) => {
  //   if (element.getAttribute('[repeat]')) {
  //     compiled.push(new CompiledRepeatDirective(
  //       element.getAttribute('[repeat]') || '',
  //       element,
  //       element.parentElement || this)
  //     );
  //   }
  // });

  const directives = html.querySelectorAll(DIRECTIVE_SELECTOR);
  directives.forEach((element) => {
    if (element.getAttribute('[if]')) {
      compiled.push(new Directives.CompiledIfDirective(
        element.getAttribute('[if]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[content]')) {
      compiled.push(new Directives.CompiledContentDirective(
        element.getAttribute('[content]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[class]')) {
      compiled.push(new Directives.CompiledClassDirective(
        element.getAttribute('[class]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[classes]')) {
      compiled.push(new Directives.CompiledClassesDirective(
        element.getAttribute('[classes]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[click]')) {
      compiled.push(new Directives.CompiledClickDirective(
        element.getAttribute('[click]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[change]')) {
      compiled.push(new Directives.CompiledChangeDirective(
        element.getAttribute('[change]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[input]')) {
      compiled.push(new Directives.CompiledInputDirective(
        element.getAttribute('[input]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[keypress]')) {
      compiled.push(new Directives.CompiledKeypressDirective(
        element.getAttribute('[keypress]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[submit]')) {
      compiled.push(new Directives.CompiledSubmitDirective(
        element.getAttribute('[submit]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[blur]')) {
      compiled.push(new Directives.CompiledBlurDirective(
        element.getAttribute('[blur]') || '',
        element,
        element.parentElement || root)
      );
    }

    if (element.getAttribute('[focus]')) {
      compiled.push(new Directives.CompiledFocusDirective(
        element.getAttribute('[focus]') || '',
        element,
        element.parentElement || root)
      );
    }
  });

  return new CompiledElement(html, compiled);
}
