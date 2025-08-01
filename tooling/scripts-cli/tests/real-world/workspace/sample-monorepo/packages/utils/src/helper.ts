import { coreFunction } from '@test/core'; // This creates circular dependency
export const helper = () => coreFunction();
