/**
 * Installation prompts for Trailhead UI CLI - migrated to use enhanced framework
 */

import {
  input,
  select,
  confirm,
  checkbox,
  createDirectoryPrompt,
  createConfirmationPrompt,
} from '@esteban-url/cli/prompts';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { InstallOptions, FrameworkChoice, PromptChoice } from '../utils/types.js';

/**
 * Pure function: Detect default Catalyst source path
 */
export const detectCatalystSource = (): string | null => {
  const candidatePaths = [
    './catalyst-ui-kit/typescript',
    '../catalyst-ui-kit/typescript',
    './catalyst-ui-kit',
    '../catalyst-ui-kit',
  ];

  for (const path of candidatePaths) {
    if (existsSync(path)) {
      // Check if it contains expected component files
      const hasComponents =
        existsSync(join(path, 'button.tsx')) || existsSync(join(path, 'src', 'button.tsx'));
      if (hasComponents) {
        return path;
      }
    }
  }

  return null;
};

/**
 * Pure function: Detect default destination directory
 */
export const detectDestinationDir = (): string => {
  if (existsSync('./src/components')) {
    return 'src/components/th';
  }
  if (existsSync('./components')) {
    return 'components/th';
  }
  return 'components/th';
};

/**
 * Pure function: Generate framework choices
 */
export const getFrameworkChoices = (): readonly FrameworkChoice[] =>
  [
    {
      name: 'Next.js',
      value: 'nextjs',
      description: 'React framework with App Router support',
    },
    {
      name: 'Vite',
      value: 'vite',
      description: 'Fast build tool with React support',
    },
    {
      name: 'RedwoodJS',
      value: 'redwood-sdk',
      description: 'Full-stack React framework',
    },
    {
      name: 'Generic React',
      value: 'generic-react',
      description: 'Any React setup',
    },
  ] as const;

/**
 * Pure function: Generate installation mode choices
 */
export const getInstallationModeChoices = (): readonly PromptChoice<
  'full' | 'minimal' | 'custom'
>[] =>
  [
    {
      name: 'Full Installation',
      value: 'full',
      description: 'Install all components, theme system, and configuration',
    },
    {
      name: 'Minimal Installation',
      value: 'minimal',
      description: 'Install core theme system only',
    },
    {
      name: 'Custom Installation',
      value: 'custom',
      description: 'Choose what to install',
    },
  ] as const;

/**
 * Prompt for framework selection
 */
export const promptFramework = async (): Promise<FrameworkChoice['value']> => {
  const choices = getFrameworkChoices();

  return await select({
    message: 'Which framework are you using?',
    choices: choices.map(choice => ({
      name: choice.name,
      value: choice.value,
      description: choice.description,
    })),
  });
};

/**
 * Prompt for installation mode
 */
export const promptInstallationMode = async (): Promise<'full' | 'minimal' | 'custom'> => {
  const choices = getInstallationModeChoices();

  return await select({
    message: 'What would you like to install?',
    choices: choices.map(choice => ({
      name: choice.name,
      value: choice.value,
      description: choice.description,
    })),
  });
};

/**
 * Show helpful error message for invalid Catalyst path
 */
const showCatalystPathHelp = (path: string, reason: string): string => {
  const helpMessage = [
    `❌ ${reason}`,
    '',
    '💡 Expected Catalyst UI Kit structure:',
    '   catalyst-ui-kit/',
    '   └── typescript/',
    '       ├── button.tsx',
    '       ├── input.tsx',
    '       ├── alert.tsx',
    '       └── ... (27 component files)',
    '',
    '📋 To fix this:',
    '1. Download Catalyst UI Kit from Tailwind Plus',
    '2. Extract the ZIP file to your project directory',
    '3. Point to the typescript/ directory within catalyst-ui-kit',
    '',
    '🔍 Try paths like:',
    '   • ./catalyst-ui-kit/typescript',
    '   • ../catalyst-ui-kit/typescript',
    '   • /path/to/catalyst-ui-kit/typescript',
    '',
    'Enter a new path or press Ctrl+C to exit:',
  ].join('\n');

  return helpMessage;
};

/**
 * Prompt for Catalyst source path with helpful error handling
 */
export const promptCatalystSource = async (): Promise<string> => {
  const detectedPath = detectCatalystSource();

  const validatePath = (value: string): string | true => {
    if (!value.trim()) {
      return 'Catalyst source path is required';
    }

    const path = value.trim();

    if (!existsSync(path)) {
      return showCatalystPathHelp(path, `Path "${path}" does not exist`);
    }

    // Check for expected component files
    const hasComponents =
      existsSync(join(path, 'button.tsx')) || existsSync(join(path, 'src', 'button.tsx'));

    if (!hasComponents) {
      return showCatalystPathHelp(
        path,
        `Path "${path}" does not contain expected Catalyst component files`
      );
    }

    return true;
  };

  return await input({
    message: 'Path to your Catalyst UI components:',
    default: detectedPath || './catalyst-ui-kit/typescript',
    validate: validatePath,
  });
};

/**
 * Prompt for destination directory using enhanced framework
 */
export const promptDestination = async (): Promise<{ destinationDir: string }> => {
  const defaultDestinationDir = detectDestinationDir();

  const directoryPrompt = createDirectoryPrompt(
    'Installation destination directory:',
    defaultDestinationDir
  );

  const destinationDir = await directoryPrompt();
  return { destinationDir };
};

/**
 * Prompt for overwrite confirmation using enhanced framework
 */
export const promptOverwrite = async (existingFiles: readonly string[]): Promise<boolean> => {
  if (existingFiles.length === 0) return false;

  const details = existingFiles.map(file => `Overwrite ${file}`);

  const overwritePrompt = createConfirmationPrompt(
    'Do you want to overwrite existing files?',
    details,
    false
  );

  return await overwritePrompt();
};

/**
 * Prompt for configuration options
 */
export const promptConfigOptions = async (): Promise<{
  generateConfig: boolean;
  installDependencies: boolean;
}> => {
  const options = await checkbox({
    message: 'Additional options:',
    choices: [
      {
        name: 'Generate Tailwind configuration',
        value: 'generateConfig',
        checked: true,
      },
      {
        name: 'Install peer dependencies',
        value: 'installDependencies',
        checked: true,
      },
    ],
  });

  return {
    generateConfig: options.includes('generateConfig'),
    installDependencies: options.includes('installDependencies'),
  };
};

/**
 * Prompt for wrapper component option using enhanced framework
 */
export const promptWrapperOption = async (): Promise<boolean> => {
  const details = [
    'Create two files per component for easier customization',
    'Wrapper: components/ui/button.tsx',
    'Implementation: components/ui/lib/catalyst-button.tsx',
    'Alternative: single file structure without wrappers',
  ];

  const wrapperPrompt = createConfirmationPrompt(
    'Use wrapper components? (recommended)',
    details,
    true
  );

  return await wrapperPrompt();
};

/**
 * Show initial help and setup guidance
 */
const showInitialGuidance = (): void => {
  console.log("Welcome to Trailhead UI! Let's set up your project.\n");
  console.log('📋 Before we start, please ensure you have:');
  console.log('   • Catalyst UI Kit downloaded from Tailwind Plus');
  console.log('   • TypeScript version extracted to your project');
  console.log('   • Components accessible at ./catalyst-ui-kit/typescript/\n');
  console.log('💡 Tip: Press Ctrl+C at any time to exit and check your setup\n');
};

/**
 * Detect framework from package.json
 */
const detectFrameworkFromPackageJson = async (): Promise<string | null> => {
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for RedwoodJS/SDK
    if (allDeps.rwsdk || allDeps['@redwoodjs/sdk']) {
      return 'redwood-sdk';
    }

    // Check for Next.js
    if (allDeps.next) {
      return 'nextjs';
    }

    // Check for Vite
    if (allDeps.vite) {
      return 'vite';
    }

    // Also check for wrangler config file (RedwoodJS indicator)
    if (
      existsSync(join(process.cwd(), 'wrangler.jsonc')) ||
      existsSync(join(process.cwd(), 'wrangler.json'))
    ) {
      return 'redwood-sdk';
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Get friendly framework name
 */
const getFrameworkName = (framework: string): string => {
  const frameworks = getFrameworkChoices();
  const found = frameworks.find(f => f.value === framework);
  return found ? found.name : framework;
};

/**
 * Run interactive installation prompts
 */
export const runInstallationPrompts = async (): Promise<InstallOptions> => {
  showInitialGuidance();

  // Always prompt for Catalyst source first
  const catalystSource = await promptCatalystSource();

  // Try to auto-detect framework first
  let framework: FrameworkChoice['value'];
  const detectedFramework = await detectFrameworkFromPackageJson();
  if (detectedFramework) {
    console.log(`\nDetected framework: ${getFrameworkName(detectedFramework)}`);
    const useDetected = await confirm({
      message: 'Use this framework?',
      default: true,
    });
    framework = useDetected
      ? (detectedFramework as FrameworkChoice['value'])
      : await promptFramework();
  } else {
    framework = await promptFramework();
  }

  const mode = await promptInstallationMode();

  let destinationDir = detectDestinationDir();

  // Prompt for destination directory in custom mode or always ask for confirmation
  if (mode === 'custom') {
    const dirs = await promptDestination();
    destinationDir = dirs.destinationDir;
  } else {
    // Show detected default and ask for confirmation
    console.log(`\nDetected destination directory:`);
    console.log(`  Installation destination: ${destinationDir}`);
    console.log(`  Components will be placed in: ${destinationDir}/`);
    console.log(`  Library files will be placed in: ${destinationDir}/lib/`);

    const useDefaults = await confirm({
      message: 'Use this destination?',
      default: true,
    });

    if (!useDefaults) {
      const dirs = await promptDestination();
      destinationDir = dirs.destinationDir;
    }
  }

  const configOptions = await promptConfigOptions();

  // Prompt for wrapper option
  const wrappers = await promptWrapperOption();

  return {
    framework,
    destinationDir,
    catalystDir: catalystSource,
    noConfig: !configOptions.generateConfig,
    force: false, // Will be handled by overwrite prompts
    dryRun: false,
    overwrite: false, // Will be handled by specific prompts
    verbose: false,
    interactive: true,
    wrappers,
  };
};
