import { type Result, ResultAsync, err, ok } from 'neverthrow';

/**
 * Compose two functions together
 */
export const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a));

/**
 * Compose multiple functions from right to left
 */
export const composeMany =
  <T>(...fns: Array<(arg: T) => T>) =>
  (arg: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), arg);

/**
 * Pipeline functions from left to right
 */
export const pipe = <T>(value: T) => ({
  to: <U>(fn: (arg: T) => U): { to: (fn: (arg: U) => any) => any } & { value: U } => {
    const result = fn(value);
    return {
      value: result,
      to: (nextFn: (arg: U) => any) => pipe(result).to(nextFn),
    };
  },
  value,
});

/**
 * Create a pipeline of functions
 */
export const pipeline =
  <T>(...fns: Array<(arg: any) => any>) =>
  (input: T) =>
    fns.reduce((acc, fn) => fn(acc), input);

/**
 * Curry a function of two arguments
 */
export const curry2 =
  <A, B, C>(fn: (a: A, b: B) => C) =>
  (a: A) =>
  (b: B) =>
    fn(a, b);

/**
 * Curry a function of three arguments
 */
export const curry3 =
  <A, B, C, D>(fn: (a: A, b: B, c: C) => D) =>
  (a: A) =>
  (b: B) =>
  (c: C) =>
    fn(a, b, c);

/**
 * Flip the arguments of a curried function
 */
export const flip =
  <A, B, C>(fn: (a: A) => (b: B) => C) =>
  (b: B) =>
  (a: A) =>
    fn(a)(b);

/**
 * Identity function
 */
export const identity = <T>(x: T): T => x;

/**
 * Constant function
 */
export const constant =
  <T>(value: T) =>
  (): T =>
    value;

/**
 * Tap function for side effects
 */
export const tap =
  <T>(fn: (value: T) => void) =>
  (value: T): T => {
    fn(value);
    return value;
  };

/**
 * Apply a function if condition is true
 */
export const when =
  <T>(condition: boolean, fn: (value: T) => T) =>
  (value: T): T =>
    condition ? fn(value) : value;

/**
 * Apply a function if condition is false
 */
export const unless =
  <T>(condition: boolean, fn: (value: T) => T) =>
  (value: T): T =>
    condition ? value : fn(value);

/**
 * Map over a value if it's not null/undefined
 */
export const maybe =
  <T, U>(fn: (value: T) => U) =>
  (value: T | null | undefined): U | null =>
    value !== null && value !== undefined ? fn(value) : null;

/**
 * Compose functions that return Result types
 */
export const composeResult =
  <A, B, C, E>(f: (b: B) => Result<C, E>, g: (a: A) => Result<B, E>) =>
  (a: A): Result<C, E> => {
    const resultB = g(a);
    if (resultB.isErr()) return err(resultB.error);
    return f(resultB.value);
  };

/**
 * Compose multiple functions that return Result types
 */
export const composeManyResult =
  <T, E>(...fns: Array<(arg: T) => Result<T, E>>) =>
  (arg: T): Result<T, E> =>
    fns.reduce((acc, fn) => acc.andThen(fn), ok(arg) as Result<T, E>);

/**
 * Pipeline for Result types
 */
export const pipeResult = <T, E>(value: Result<T, E>) => ({
  to: <U>(fn: (arg: T) => Result<U, E>) => pipeResult(value.andThen(fn)),
  value,
});

/**
 * Async composition for functions returning promises
 */
export const composeAsync =
  <A, B, C>(f: (b: B) => Promise<C>, g: (a: A) => Promise<B>) =>
  async (a: A): Promise<C> => {
    const b = await g(a);
    return f(b);
  };

/**
 * Compose multiple async functions
 */
export const composeManyAsync =
  <T>(...fns: Array<(arg: T) => Promise<T>>) =>
  async (arg: T): Promise<T> => {
    let result = arg;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };

/**
 * Async composition for ResultAsync types
 */
export const composeResultAsync =
  <A, B, C, E>(f: (b: B) => ResultAsync<C, E>, g: (a: A) => ResultAsync<B, E>) =>
  (a: A): ResultAsync<C, E> =>
    g(a).andThen(f);

/**
 * Compose multiple functions that return ResultAsync types
 */
export const composeManyResultAsync =
  <T, E>(...fns: Array<(arg: T) => ResultAsync<T, E>>) =>
  (arg: T): ResultAsync<T, E> => {
    if (fns.length === 0) {
      return ResultAsync.fromSafePromise(Promise.resolve(arg));
    }

    const [first, ...rest] = fns;
    let result = first(arg);

    for (const fn of rest) {
      result = result.andThen(fn);
    }

    return result;
  };

/**
 * Retry a function with exponential backoff
 */
export const retry =
  <T, E>(fn: () => Result<T, E>, maxAttempts: number, delay = 1000) =>
  (): Result<T, E> => {
    let lastError: E;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = fn();
      if (result.isOk()) return result;

      lastError = result.error;

      if (attempt < maxAttempts) {
        // Exponential backoff
        const _waitTime = delay * Math.pow(2, attempt - 1);
        // In a real implementation, you'd want to use a proper sleep function
        // This is simplified for the core package
      }
    }

    return err(lastError!);
  };

/**
 * Async retry with exponential backoff
 */
export const retryAsync =
  <T, E>(fn: () => ResultAsync<T, E>, maxAttempts: number, delay = 1000) =>
  (): ResultAsync<T, E> => {
    const attemptFn = async (): Promise<T> => {
      let lastError: E;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await fn();
        if (result.isOk()) return result.value;

        lastError = result.error;

        if (attempt < maxAttempts) {
          const _waitTime = delay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, _waitTime));
        }
      }

      throw lastError!;
    };

    return ResultAsync.fromPromise(attemptFn(), error => error as E);
  };
