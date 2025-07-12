#!/usr/bin/env node

// Temporary simple command interface until @trailhead/cli is available
interface Command {
  name: string;
  description: string;
  handler: (args: any) => Promise<any>;
}

function createCommand(config: Command): Command {
  return config;
}
import { ok, err, createCoreError } from '@trailhead/core';
import { createConfigManager } from '../lib/config-manager.js';
import { createPresetManager } from '../lib/preset-manager.js';
// import { generateConfigJsonSchema } from '../lib/config-schema.js';

/**
 * Configuration management command for create-trailhead-cli
 */
export const configCommand = createCommand({
  name: 'config',
  description: 'Manage configuration files and presets',
  async handler(args: any) {
    const { flags } = args;

    try {
      const configManager = createConfigManager({
        configDir: flags['config-dir'],
        verbose: flags.verbose,
      });
      const presetManager = createPresetManager(configManager);

      // List presets
      if (flags.list || flags['list-presets']) {
        return await handleListPresets(presetManager);
      }

      // Generate JSON schema
      if (flags['generate-schema']) {
        return await handleGenerateSchema(configManager);
      }

      // Load specific preset
      if (flags.preset) {
        return await handleLoadPreset(presetManager, flags.preset);
      }

      // Clean up old configs
      if (flags.cleanup) {
        return await handleCleanup(configManager);
      }

      // Show help if no specific action
      console.log(`
create-trailhead-cli config - Configuration and preset management

Usage:
  create-trailhead-cli config [options]

Options:
  --list-presets          List all available presets with details
  --generate-schema       Generate JSON schema for IDE support
  --preset <name>         Show details of a specific preset
  --cleanup               Clean up old configuration files
  --config-dir <path>     Use custom configuration directory
  --verbose               Enable verbose output

Examples:
  create-trailhead-cli config --list-presets
  create-trailhead-cli config --preset advanced-cli
  create-trailhead-cli config --generate-schema
  create-trailhead-cli config --cleanup

Configuration Files:
  Config directory: ${configManager.getConfigDir()}
  Preset directory: ${configManager.getPresetDir()}
`);

      return ok(undefined);
    } catch (error) {
      return err(
        createCoreError('CONFIG_COMMAND_ERROR', 'Configuration command failed', {
          component: 'create-trailhead-cli',
          operation: 'configCommand',
          cause: error,
          recoverable: false,
        })
      );
    }
  },
});

/**
 * Handle listing presets
 */
async function handleListPresets(presetManager: any) {
  console.log('📋 Listing available presets...\n');

  const listResult = await presetManager.listPresetsDetailed();
  if (listResult.isErr()) {
    console.error('❌ Failed to list presets:', listResult.error.message);
    return listResult;
  }

  return ok(undefined);
}

/**
 * Handle generating JSON schema
 */
async function handleGenerateSchema(configManager: any) {
  console.log('📄 Generating JSON schema...');

  const schemaResult = await configManager.generateSchemaFile();
  if (schemaResult.isErr()) {
    console.error('❌ Failed to generate schema:', schemaResult.error.message);
    return schemaResult;
  }

  console.log(`✅ JSON schema generated: ${schemaResult.value}`);
  console.log('\nThis schema file can be used for IDE autocompletion and validation.');

  return ok(undefined);
}

/**
 * Handle loading specific preset
 */
async function handleLoadPreset(presetManager: any, presetName: string) {
  console.log(`📋 Loading preset: ${presetName}`);

  const presetResult = await presetManager.configManager.loadPreset(presetName);
  if (presetResult.isErr()) {
    console.error(`❌ Failed to load preset '${presetName}':`, presetResult.error.message);
    return presetResult;
  }

  const preset = presetResult.value;

  console.log(`\n✅ Preset: ${preset.name}`);
  console.log(`   Description: ${preset.description}`);
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

  if (preset.ide) {
    console.log(`   IDE: ${preset.ide}`);
  }

  console.log(`   Include docs: ${preset.includeDocs ?? 'default'}`);
  console.log(`   Initialize Git: ${preset.initGit ?? 'default'}`);
  console.log(`   Install dependencies: ${preset.installDependencies ?? 'default'}`);

  return ok(undefined);
}

/**
 * Handle cleanup
 */
async function handleCleanup(configManager: any) {
  console.log('🧹 Cleaning up old configuration files...');

  const cleanupResult = await configManager.cleanup(30); // 30 days
  if (cleanupResult.isErr()) {
    console.error('❌ Failed to cleanup:', cleanupResult.error.message);
    return cleanupResult;
  }

  const cleanedCount = cleanupResult.value;
  console.log(`✅ Cleaned up ${cleanedCount} old configuration file(s)`);

  return ok(undefined);
}
