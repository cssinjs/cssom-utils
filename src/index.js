// @flow

import warning from 'warning';

import {
  type CSSStyleRule,
  type CSSKeyframesRule,
  type CSSMediaRule,
  type CSSValue,
} from './types';

function memoize<Value>(fn: () => Value): () => Value {
  let computed = false;
  let value = null;

  return () => {
    if (!computed) {
      computed = true;
      value = fn();
    }

    // $FlowFixMe: value can't be null here, though flow can't do that
    return value;
  };
}

export const getHead = memoize(
  (): HTMLElement => document.head || document.getElementsByTagName('head')[0],
);

/**
 * Get a style property value.
 */
export function getPropertyValue(
  cssRule: HTMLElement | CSSStyleRule,
  prop: string,
): string {
  try {
    return cssRule.style.getPropertyValue(prop);
  } catch (err) {
    // IE may throw if property is unknown.
    return '';
  }
}

/**
 * Set a style property.
 */
export function setProperty(
  cssRule: HTMLElement | CSSStyleRule,
  prop: string,
  value: CSSValue,
): boolean {
  try {
    if (Array.isArray(value)) {
      if (value[value.length - 1] === '!important') {
        cssRule.style.setProperty(prop, ((value[0]: any): string), 'important');
      } else {
        cssRule.style.setProperty(prop, ((value[0]: any): string));
      }

      return true;
    }

    cssRule.style.setProperty(prop, ((value: any): string));

    return true;
  } catch (err) {
    // IE may throw if property is unknown.
    return false;
  }
}

/**
 * Remove a style property.
 */
export function removeProperty(
  cssRule: HTMLElement | CSSStyleRule,
  prop: string,
) {
  try {
    cssRule.style.removeProperty(prop);
  } catch (err) {
    warning(
      false,
      '[CSSOM] DOMException "%s" was thrown. Tried to remove property "%s".',
      err.message,
      prop,
    );
  }
}

/**
 * Set the selector.
 */
export function setSelector(
  cssRule: CSSStyleRule,
  selectorText: string,
): boolean {
  // eslint-disable-next-line no-param-reassign
  cssRule.selectorText = selectorText;

  // Return false if setter was not successful.
  // Currently works in chrome only.
  return cssRule.selectorText === selectorText;
}

/**
 * Find a comment inside the head element.
 */
export function findCommentNode(text: string): Node | null {
  const head = getHead();
  for (let i = 0; i < head.childNodes.length; i++) {
    const node = head.childNodes[i];
    if (node.nodeType === 8 && node.nodeValue.trim() === text) {
      return node;
    }
  }
  return null;
}

type NextNode = {
  parent: ?Node,
  node: ?Node
};

/**
 * Insert style element into the DOM.
 */
export function insertStyle(style: HTMLElement, nextNode: NextNode | null) {
  if (nextNode !== null) {
    if (nextNode.parent) {
      nextNode.parent.insertBefore(style, nextNode.node);
    } else {
      warning(false, '[CSSOM-utils] Insertion point is not in the DOM.');
    }

    return;
  }

  getHead().appendChild(style);
}

/**
 * Read jss nonce setting from the page if the user has set it.
 */
export const getNonce = memoize(
  (): ?string => {
    const node = document.querySelector('meta[property="csp-nonce"]');

    return node ? node.getAttribute('content') : null;
  },
);

export function insertRule(
  container: CSSStyleSheet | CSSKeyframesRule | CSSMediaRule,
  rule: string,
  index?: number = container.cssRules.length,
) {
  try {
    if (typeof container.insertRule === 'function') {
      container.insertRule(rule, index);
    } else if (typeof container.appendRule === 'function') {
      container.appendRule(rule);
    }

    return container.cssRules[index];
  } catch (err) {
    warning(false, '[JSS] Can not insert an unsupported rule \n\r%s', rule);

    return null;
  }
}
