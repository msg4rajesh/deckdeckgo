import {ExecCommandStyle} from '../interfaces/interfaces';

import {getAnchorElement} from '@deckdeckgo/utils';

import {DeckdeckgoInlineEditorUtils} from './utils';
import {findStyleNode} from './node.utils';

export function execCommandStyle(selection: Selection, action: ExecCommandStyle, containers: string) {
  const container: HTMLElement | null = getAnchorElement(selection);

  if (!container) {
    return;
  }

  const sameSelection: boolean = container && container.innerText === selection.toString();

  if (sameSelection && !DeckdeckgoInlineEditorUtils.isContainer(containers, container) && container.style[action.style] !== undefined) {
    updateSelection(container, action, containers);

    return;
  }

  replaceSelection(container, action, selection, containers);
}

function updateSelection(container: HTMLElement, action: ExecCommandStyle, containers: string) {
  container.style[action.style] = getStyleValue(container, action, containers);

  cleanChildren(action, container);
}

function replaceSelection(container: HTMLElement, action: ExecCommandStyle, selection: Selection, containers: string) {
  const range: Range = selection.getRangeAt(0);

  // User selected a all list?
  if (
    range.commonAncestorContainer &&
    ['ol', 'ul', 'dl'].some((listType) => listType === range.commonAncestorContainer.nodeName.toLowerCase())
  ) {
    updateSelection(range.commonAncestorContainer as HTMLElement, action, containers);
    return;
  }

  const fragment: DocumentFragment = range.extractContents();

  const span: HTMLSpanElement = createSpan(container, action, containers);
  span.appendChild(fragment);

  cleanChildren(action, span);
  flattenChildren(action, span);

  range.insertNode(span);
  selection.selectAllChildren(span);
}

function cleanChildren(action: ExecCommandStyle, span: HTMLSpanElement) {
  if (!span.hasChildNodes()) {
    return;
  }

  // Clean direct (> *) children with same style
  const children: HTMLElement[] = Array.from(span.children).filter((element: HTMLElement) => {
    return element.style[action.style] !== undefined && element.style[action.style] !== '';
  }) as HTMLElement[];

  if (children && children.length > 0) {
    children.forEach((element: HTMLElement) => {
      element.style[action.style] = '';

      if (element.getAttribute('style') === '' || element.style === null) {
        element.removeAttribute('style');
      }
    });
  }

  // Direct children (> *) may have children (*) which need to be cleaned too
  Array.from(span.children).forEach((element: HTMLElement) => cleanChildren(action, element));
}

function createSpan(container: HTMLElement, action: ExecCommandStyle, containers: string): HTMLSpanElement {
  const span: HTMLSpanElement = document.createElement('span');
  span.style[action.style] = getStyleValue(container, action, containers);

  return span;
}

// We assume that if the same style is applied, user want actually to remove it (same behavior as in MS Word)
// Note: initial may have no effect on the background-color
function getStyleValue(container: HTMLElement, action: ExecCommandStyle, containers: string): string {
  if (!container) {
    return action.value;
  }

  if (action.initial(container)) {
    return 'initial';
  }

  const style: Node | null = findStyleNode(container, action.style, containers);

  if (action.initial(style as HTMLElement)) {
    return 'initial';
  }

  return action.value;
}

// We try to not keep <span/> in the tree if we can use text
function flattenChildren(action: ExecCommandStyle, span: HTMLSpanElement) {
  if (!span.hasChildNodes()) {
    return;
  }

  // Flatten direct (> *) children with no style
  const children: HTMLElement[] = Array.from(span.children).filter((element: HTMLElement) => {
    const style: string | null = element.getAttribute('style');
    return !style || style === '';
  }) as HTMLElement[];

  if (children && children.length > 0) {
    children.forEach((element: HTMLElement) => {
      // Can only be flattened if there is no other style applied to a children, like a color to part of a text with a background
      const styledChildren: NodeListOf<HTMLElement> = element.querySelectorAll('[style]');
      if (!styledChildren || styledChildren.length === 0) {
        const text: Text = document.createTextNode(element.textContent);
        element.parentElement.replaceChild(text, element);
      }
    });

    return;
  }

  // Direct children (> *) may have children (*) which need to be flattened too
  Array.from(span.children).forEach((element: HTMLElement) => flattenChildren(action, element));
}
