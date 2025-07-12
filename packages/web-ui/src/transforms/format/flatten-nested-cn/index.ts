/**
 * @fileoverview Flatten Nested CN Transform Index
 *
 * Entry point for the flatten nested cn transform that handles
 * nested cn() and clsx() calls within cn() calls.
 */

export { transformFlattenNestedCn } from './transform.js';
export type { FlattenNestedCnConfig, FlattenNestedCnContext } from './transform.js';
