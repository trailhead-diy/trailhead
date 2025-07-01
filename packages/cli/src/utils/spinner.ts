import ora from 'ora';
export { ora };

export function createSpinner(text: string) {
  return ora({
    text,
    spinner: 'dots',
  });
}

export function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();

  return fn()
    .then((result) => {
      spinner.succeed();
      return result;
    })
    .catch((error) => {
      spinner.fail();
      throw error;
    });
}
