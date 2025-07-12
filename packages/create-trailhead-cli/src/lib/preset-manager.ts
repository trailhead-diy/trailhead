import { ok, err, createCoreError } from '@trailhead/core';
import type { Result } from '@trailhead/core';
import { select, confirm, input } from '@inquirer/prompts';
import { ConfigManager, BUILT_IN_PRESETS, type PresetConfig } from './config-manager.js';
import type { ModernProjectConfig } from './interactive-prompts.js';
import { getRecommendedModules } from './modular-templates.js';

/**
 * Preset manager for handling configuration presets
 * Provides interactive preset selection and management
 */

export class PresetManager {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Interactive preset selection
   */
  async selectPreset(): Promise<Result<PresetConfig | null, any>> {
    try {
      // Get available presets (built-in + custom)
      const availablePresets = await this.getAvailablePresets();
      if (availablePresets.isErr()) {
        return err(availablePresets.error);
      }

      const presets = availablePresets.value;

      if (presets.length === 0) {
        console.log('No presets available. Using default configuration.');
        return ok(null);
      }

      // Ask if user wants to use a preset
      const usePreset = await confirm({
        message: 'Would you like to use a configuration preset?',
        default: true,
      });

      if (!usePreset) {
        return ok(null);
      }

      // Show preset options
      const choices = presets.map((preset: PresetConfig) => ({
        name: `${preset.name} - ${preset.description}`,
        value: preset.name,
        description: this.getPresetSummary(preset),
      }));

      choices.push({
        name: 'Custom configuration',
        value: 'custom',
        description: 'Configure everything manually',
      });

      const selectedPresetName = await select({
        message: 'Select a preset:',
        choices,
      });

      if (selectedPresetName === 'custom') {
        return ok(null);
      }

      // Find and return the selected preset
      const selectedPreset = presets.find((p: PresetConfig) => p.name === selectedPresetName);
      if (!selectedPreset) {
        return err(
          createCoreError('PRESET_NOT_FOUND', `Preset not found: ${selectedPresetName}`, {
            component: 'create-trailhead-cli',
            operation: 'selectPreset',
          })
        );
      }

      return ok(selectedPreset);
    } catch (error) {
      return err(
        createCoreError('PRESET_SELECTION_ERROR', 'Failed to select preset', {
          component: 'create-trailhead-cli',
          operation: 'selectPreset',
          cause: error,
          recoverable: false,
        })
      );
    }
  }

  /**
   * Interactive preset creation
   */
  async createPreset(baseConfig: ModernProjectConfig): Promise<Result<PresetConfig, any>> {
    try {
      console.log('\n📋 Creating a new preset from your current configuration...\n');

      const name = await input({
        message: 'Preset name:',
        validate: (value: string) => {
          if (!value.trim()) return 'Preset name is required';
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'Preset name must be lowercase alphanumeric with hyphens only';
          }
          return true;
        },
      });

      const description = await input({
        message: 'Preset description:',
        default: `Custom preset based on ${baseConfig.template} template`,
      });

      // Ask which settings to include in preset
      const includeSettings = await confirm({
        message: 'Include package manager and Node.js version preferences?',
        default: true,
      });

      const includeDevSettings = await confirm({
        message: 'Include development preferences (IDE, docs, CI/CD)?',
        default: true,
      });

      // Build preset configuration
      const preset: PresetConfig = {
        name,
        description,
        template: baseConfig.template,
        projectType: baseConfig.projectType,
        features: { ...baseConfig.features },
      };

      if (includeSettings) {
        preset.packageManager = baseConfig.packageManager;
        preset.nodeVersion = baseConfig.nodeVersion;
      }

      if (includeDevSettings) {
        preset.ide = baseConfig.ide;
        preset.includeDocs = baseConfig.includeDocs;
        preset.initGit = baseConfig.initGit;
        preset.installDependencies = baseConfig.installDependencies;
      }

      // Save the preset
      const saveResult = await this.configManager.savePreset(preset);
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

      console.log(`\n✅ Preset '${name}' created successfully!`);
      console.log(`   Saved to: ${saveResult.value}`);

      return ok(preset);
    } catch (error) {
      return err(
        createCoreError('PRESET_CREATE_ERROR', 'Failed to create preset', {
          component: 'create-trailhead-cli',
          operation: 'createPreset',
          cause: error,
          recoverable: false,
        })
      );
    }
  }

  /**
   * List all available presets with details
   */
  async listPresetsDetailed(): Promise<Result<void, any>> {
    try {
      const availablePresets = await this.getAvailablePresets();
      if (availablePresets.isErr()) {
        return err(availablePresets.error);
      }

      const presets = availablePresets.value;

      if (presets.length === 0) {
        console.log('No presets available.');
        return ok(undefined);
      }

      console.log('\n📋 Available Presets:\n');

      // Separate built-in and custom presets
      const builtInPresets = presets.filter((p: PresetConfig) =>
        BUILT_IN_PRESETS.some(bp => bp.name === p.name)
      );
      const customPresets = presets.filter(
        (p: PresetConfig) => !BUILT_IN_PRESETS.some(bp => bp.name === p.name)
      );

      if (builtInPresets.length > 0) {
        console.log('🏗️  Built-in Presets:');
        builtInPresets.forEach((preset: PresetConfig) => {
          console.log(`   ${preset.name}`);
          console.log(`     ${preset.description}`);
          console.log(`     ${this.getPresetSummary(preset)}`);
          console.log();
        });
      }

      if (customPresets.length > 0) {
        console.log('⚙️  Custom Presets:');
        customPresets.forEach((preset: PresetConfig) => {
          console.log(`   ${preset.name}`);
          console.log(`     ${preset.description}`);
          console.log(`     ${this.getPresetSummary(preset)}`);
          console.log();
        });
      }

      return ok(undefined);
    } catch (error) {
      return err(
        createCoreError('PRESET_LIST_ERROR', 'Failed to list presets', {
          component: 'create-trailhead-cli',
          operation: 'listPresetsDetailed',
          cause: error,
          recoverable: false,
        })
      );
    }
  }

  /**
   * Generate recommended preset based on project type
   */
  generateRecommendedPreset(projectType: string, template: string): PresetConfig {
    const recommendedModules = getRecommendedModules(projectType, template);

    const features = {
      core: true as const,
      config: recommendedModules.includes('config'),
      validation: recommendedModules.includes('validation'),
      testing: recommendedModules.includes('testing'),
      docs: recommendedModules.includes('docs'),
      cicd: recommendedModules.includes('cicd'),
    };

    return {
      name: `recommended-${projectType}-${template}`,
      description: `Recommended configuration for ${template} ${projectType.replace('-', ' ')}`,
      template: template as 'basic' | 'advanced',
      projectType: projectType as 'standalone-cli' | 'library' | 'monorepo-package',
      features,
      packageManager: 'pnpm',
      nodeVersion: '18',
      ide: 'vscode',
      includeDocs: features.docs,
      initGit: projectType !== 'monorepo-package',
      installDependencies: projectType !== 'monorepo-package',
    };
  }

  /**
   * Apply preset with interactive overrides
   */
  async applyPresetInteractive(
    preset: PresetConfig,
    userConfig: Partial<ModernProjectConfig>
  ): Promise<Result<Partial<ModernProjectConfig>, any>> {
    try {
      console.log(`\n📋 Applying preset: ${preset.name}`);
      console.log(`   ${preset.description}\n`);

      // Show what the preset includes
      console.log('Preset includes:');
      console.log(`   Template: ${preset.template}`);
      console.log(`   Project type: ${preset.projectType}`);

      const enabledFeatures = Object.entries(preset.features || {})
        .filter(([, enabled]) => enabled)
        .map(([name]) => name);

      if (enabledFeatures.length > 0) {
        console.log(`   Features: ${enabledFeatures.join(', ')}`);
      }

      if (preset.packageManager) {
        console.log(`   Package manager: ${preset.packageManager}`);
      }

      if (preset.nodeVersion) {
        console.log(`   Node.js version: ${preset.nodeVersion}`);
      }

      console.log();

      // Ask if user wants to customize any settings
      const customize = await confirm({
        message: 'Would you like to customize any preset settings?',
        default: false,
      });

      let finalConfig = { ...userConfig };

      if (customize) {
        // Allow overriding key settings
        if (preset.packageManager) {
          const keepPackageManager = await confirm({
            message: `Keep package manager (${preset.packageManager})?`,
            default: true,
          });

          if (!keepPackageManager) {
            const newPackageManager = await select({
              message: 'Package manager:',
              choices: [
                { name: 'pnpm (recommended)', value: 'pnpm' },
                { name: 'npm', value: 'npm' },
              ],
            });
            finalConfig.packageManager = newPackageManager as 'npm' | 'pnpm';
          }
        }

        if (preset.nodeVersion) {
          const keepNodeVersion = await confirm({
            message: `Keep Node.js version (${preset.nodeVersion})?`,
            default: true,
          });

          if (!keepNodeVersion) {
            const newNodeVersion = await input({
              message: 'Node.js version target:',
              default: preset.nodeVersion,
              validate: (value: string) => {
                const num = parseInt(value);
                if (isNaN(num) || num < 14) return 'Node.js version must be 14 or higher';
                return true;
              },
            });
            finalConfig.nodeVersion = newNodeVersion;
          }
        }
      }

      // Apply preset with any user overrides
      return this.configManager.applyPreset(preset.name, finalConfig);
    } catch (error) {
      return err(
        createCoreError('PRESET_APPLY_INTERACTIVE_ERROR', 'Failed to apply preset interactively', {
          component: 'create-trailhead-cli',
          operation: 'applyPresetInteractive',
          cause: error,
          recoverable: false,
        })
      );
    }
  }

  /**
   * Get all available presets (built-in + custom)
   */
  private async getAvailablePresets(): Promise<Result<PresetConfig[], any>> {
    try {
      const presets: PresetConfig[] = [...BUILT_IN_PRESETS];

      // Load custom presets
      const customPresetNames = await this.configManager.listPresets();
      if (customPresetNames.isOk()) {
        for (const presetName of customPresetNames.value) {
          const presetResult = await this.configManager.loadPreset(presetName);
          if (presetResult.isOk()) {
            presets.push(presetResult.value);
          }
        }
      }

      return ok(presets);
    } catch (error) {
      return err(
        createCoreError('GET_PRESETS_ERROR', 'Failed to get available presets', {
          component: 'create-trailhead-cli',
          operation: 'getAvailablePresets',
          cause: error,
          recoverable: false,
        })
      );
    }
  }

  /**
   * Generate a summary description of a preset
   */
  private getPresetSummary(preset: PresetConfig): string {
    const parts: string[] = [];

    parts.push(`${preset.template} template`);
    parts.push(preset.projectType.replace('-', ' '));

    const enabledFeatures = Object.entries(preset.features || {})
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
      .filter(name => name !== 'core');

    if (enabledFeatures.length > 0) {
      parts.push(`features: ${enabledFeatures.join(', ')}`);
    }

    if (preset.packageManager) {
      parts.push(preset.packageManager);
    }

    return parts.join(' • ');
  }
}

/**
 * Create a preset manager instance
 */
export function createPresetManager(configManager?: ConfigManager): PresetManager {
  const manager = configManager || new ConfigManager();
  return new PresetManager(manager);
}
