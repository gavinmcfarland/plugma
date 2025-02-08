import { registry } from './registry';

export function test(name: string, fn: () => void) {
  if (typeof figma === 'undefined') {
    throw new Error(
      'This is awkward... this function should never run outside Figma.\n' +
        '  Did you mean to import { test } from "#plugma/testing"?',
    );
  }

  registry.register(name, fn);
}
