/**
 * Transform command prompts
 */

export interface TransformPromptOptions {
  currentSrcDir?: string
}

export interface TransformPromptResults {
  src?: string
}

/**
 * Run interactive prompts for transform command
 */
export async function runTransformPrompts(
  options: TransformPromptOptions
): Promise<TransformPromptResults> {
  const inquirer = await import('@inquirer/prompts')

  const src = await inquirer.input({
    message: 'Source directory containing components:',
    default: options.currentSrcDir || 'src/components/lib',
  })

  return {
    src,
  }
}
