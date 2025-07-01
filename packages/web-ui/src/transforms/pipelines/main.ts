/**
 * Main pipeline for catalyst-to-semantic transformation
 * Orchestrates all transforms in the correct order
 */

import { readFile, writeFile, readdir } from 'fs/promises'
import { join } from 'path'
import chalk from 'chalk'
import { TRANSFORM_ORDER } from './transform-order.js'

/**
 * Check if an error is a non-critical AST parsing warning that should be suppressed
 */
function isNonCriticalASTError(error: any): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message

  // Suppress specific AST parsing warnings that don't affect functionality
  const suppressedPatterns = [
    'Rest element must be last element',
    'SyntaxError: Rest element must be last element',
    'ElementAfterRest',
  ]

  return suppressedPatterns.some((pattern) => message.includes(pattern))
}
import { baseMappingsTransform } from '../components/common/colors/base-mappings.js'
import { interactiveStatesTransform } from '../components/common/colors/interactive-states.js'
import { darkModeTransform } from '../components/common/colors/dark-mode.js'
import { specialPatternsTransform } from '../components/common/colors/special-patterns.js'
import { removeColorPrefixTransform } from '../components/common/colors/remove-color-prefix.js'
import { addEnhancedFallbacksTransform } from '../components/common/colors/add-enhanced-fallbacks.js'
import { buttonColorMappingsTransform } from '../components/button/color-mappings.js'
import { buttonSemanticEnhancementTransform } from '../components/button/semantic-enhancement.js'
import { buttonAddSemanticColorsTransform } from '../components/button/add-semantic-colors.js'
import { clsxToCnTransform } from '../components/common/imports/clsx-to-cn.js'
import { addClassNameParameterTransform } from '../components/common/className/add-parameter.js'
import { wrapStaticClassNameTransform } from '../components/common/className/wrap-static.js'
import { ensureClassNameInCnTransform } from '../components/common/className/ensure-in-cn.js'
import { reorderClassNameArgsTransform } from '../components/common/className/reorder-args.js'
import { removeUnusedClassNameTransform } from '../components/common/className/remove-unused.js'
import { textColorsEdgeCaseTransform } from '../components/common/edge-cases/text-colors.js'
import { iconFillsEdgeCaseTransform } from '../components/common/edge-cases/icon-fills.js'
import { blueToPrimaryEdgeCaseTransform } from '../components/common/edge-cases/blue-to-primary.js'
import { focusStatesEdgeCaseTransform } from '../components/common/edge-cases/focus-states.js'
import { fileHeadersTransform } from '../components/common/formatting/file-headers.js'
import { postProcessTransform } from '../components/common/formatting/post-process-transform.js'
import type { Transform, TransformPhase } from '../shared/types.js'

// Import all component transforms
import { badgeSemanticEnhancementTransform } from '../components/badge/semantic-enhancement.js'
import { badgeColorMappingsTransform } from '../components/badge/color-mappings.js'
import { badgeAddSemanticColorsTransform } from '../components/badge/add-semantic-colors.js'
import { checkboxAddSemanticColorsTransform } from '../components/checkbox/add-semantic-colors.js'
import { radioAddSemanticColorsTransform } from '../components/radio/add-semantic-colors.js'
import { switchAddSemanticColorsTransform } from '../components/switch/add-semantic-colors.js'
import { checkboxSemanticEnhancementTransform } from '../components/checkbox/semantic-enhancement.js'
import { checkboxColorMappingsTransform } from '../components/checkbox/color-mappings.js'
import { radioSemanticEnhancementTransform } from '../components/radio/semantic-enhancement.js'
import { radioColorMappingsTransform } from '../components/radio/color-mappings.js'
import { switchSemanticEnhancementTransform } from '../components/switch/semantic-enhancement.js'
import { switchColorMappingsTransform } from '../components/switch/color-mappings.js'
import { textSemanticEnhancementTransform } from '../components/text/semantic-enhancement.js'
import { linkSemanticEnhancementTransform } from '../components/link/semantic-enhancement.js'
import { inputSemanticEnhancementTransform } from '../components/input/semantic-enhancement.js'
import { inputColorMappingsTransform } from '../components/input/color-mappings.js'
import { fieldsetSemanticEnhancementTransform } from '../components/fieldset/semantic-enhancement.js'
import { fieldsetColorMappingsTransform } from '../components/fieldset/color-mappings.js'
import { dropdownColorMappingsTransform } from '../components/dropdown/color-mappings.js'
import { dropdownSemanticEnhancementTransform } from '../components/dropdown/semantic-enhancement.js'
import { comboboxColorMappingsTransform } from '../components/combobox/color-mappings.js'
import { comboboxSemanticEnhancementTransform } from '../components/combobox/semantic-enhancement.js'
import { listboxColorMappingsTransform } from '../components/listbox/color-mappings.js'
import { tableColorMappingsTransform } from '../components/table/color-mappings.js'
import { selectColorMappingsTransform } from '../components/select/color-mappings.js'
import { textareaColorMappingsTransform } from '../components/textarea/color-mappings.js'
import { navbarColorMappingsTransform } from '../components/navbar/color-mappings.js'
import { navbarSemanticEnhancementTransform } from '../components/navbar/semantic-enhancement.js'
import { alertColorMappingsTransform } from '../components/alert/color-mappings.js'
import { alertSemanticEnhancementTransform } from '../components/alert/semantic-enhancement.js'
import { dialogSemanticEnhancementTransform } from '../components/dialog/semantic-enhancement.js'
import { tableSemanticEnhancementTransform } from '../components/table/semantic-enhancement.js'
// Duplicate imports removed - these are already imported above
import { sidebarEdgeCasesTransform } from '../components/sidebar/edge-cases.js'

// Missing semantic enhancement transforms
import { listboxSemanticEnhancementTransform } from '../components/listbox/semantic-enhancement.js'
import { selectSemanticEnhancementTransform } from '../components/select/semantic-enhancement.js'
import { sidebarSemanticEnhancementTransform } from '../components/sidebar/semantic-enhancement.js'
import { textareaSemanticEnhancementTransform } from '../components/textarea/semantic-enhancement.js'

// Missing color mapping transforms
import { linkColorMappingsTransform } from '../components/link/color-mappings.js'
import { textColorMappingsTransform } from '../components/text/color-mappings.js'
import { sidebarColorMappingsTransform } from '../components/sidebar/color-mappings.js'
import { dialogColorMappingsTransform } from '../components/dialog/color-mappings.js'
import { avatarColorMappingsTransform } from '../components/avatar/color-mappings.js'
import { dividerColorMappingsTransform } from '../components/divider/color-mappings.js'
import { paginationColorMappingsTransform } from '../components/pagination/color-mappings.js'
import { sidebarLayoutColorMappingsTransform } from '../components/sidebar-layout/color-mappings.js'
import { stackedLayoutColorMappingsTransform } from '../components/stacked-layout/color-mappings.js'
import { authLayoutColorMappingsTransform } from '../components/auth-layout/color-mappings.js'
import { descriptionListColorMappingsTransform } from '../components/description-list/color-mappings.js'
import { headingColorMappingsTransform } from '../components/heading/color-mappings.js'

// Missing semantic enhancement transforms
import { avatarSemanticEnhancementTransform } from '../components/avatar/semantic-enhancement.js'
import { dividerSemanticEnhancementTransform } from '../components/divider/semantic-enhancement.js'
import { paginationSemanticEnhancementTransform } from '../components/pagination/semantic-enhancement.js'
import { sidebarLayoutSemanticEnhancementTransform } from '../components/sidebar-layout/semantic-enhancement.js'
import { stackedLayoutSemanticEnhancementTransform } from '../components/stacked-layout/semantic-enhancement.js'
import { authLayoutSemanticEnhancementTransform } from '../components/auth-layout/semantic-enhancement.js'
import { descriptionListSemanticEnhancementTransform } from '../components/description-list/semantic-enhancement.js'
import { headingSemanticEnhancementTransform } from '../components/heading/semantic-enhancement.js'

// Import default color update transforms
import {
  buttonDefaultColorTransform,
  badgeDefaultColorTransform,
  checkboxDefaultColorTransform,
  radioDefaultColorTransform,
  switchDefaultColorTransform,
} from '../components/common/semantic-tokens/update-defaults/index.js'

// Map of transform paths to actual transform implementations
// This will be populated as we implement more transforms
const TRANSFORM_MAP: Record<string, Transform> = {
  // Import transforms
  'common/imports/clsx-to-cn': clsxToCnTransform,

  // ClassName transforms
  'common/className/add-parameter': addClassNameParameterTransform,
  'common/className/wrap-static': wrapStaticClassNameTransform,
  'common/className/ensure-in-cn': ensureClassNameInCnTransform,
  'common/className/reorder-args': reorderClassNameArgsTransform,
  'common/className/remove-unused': removeUnusedClassNameTransform,

  // Color transforms
  'common/colors/base-mappings': baseMappingsTransform,
  'common/colors/interactive-states': interactiveStatesTransform,
  'common/colors/dark-mode': darkModeTransform,
  'common/colors/special-patterns': specialPatternsTransform,
  'common/colors/remove-color-prefix': removeColorPrefixTransform,
  'common/colors/add-enhanced-fallbacks': addEnhancedFallbacksTransform,

  // Edge case transforms
  'common/edge-cases/text-colors': textColorsEdgeCaseTransform,
  'common/edge-cases/icon-fills': iconFillsEdgeCaseTransform,
  'common/edge-cases/blue-to-primary': blueToPrimaryEdgeCaseTransform,
  'common/edge-cases/focus-states': focusStatesEdgeCaseTransform,

  // Formatting transforms
  'common/formatting/file-headers': fileHeadersTransform,
  'common/formatting/post-process': postProcessTransform,

  // Component-specific transforms
  'components/button/color-mappings': buttonColorMappingsTransform,
  'components/button/semantic-enhancement': buttonSemanticEnhancementTransform,
  'components/button/add-semantic-colors': buttonAddSemanticColorsTransform,
  'components/badge/color-mappings': badgeColorMappingsTransform,
  'components/badge/semantic-enhancement': badgeSemanticEnhancementTransform,
  'components/badge/add-semantic-colors': badgeAddSemanticColorsTransform,
  'components/checkbox/color-mappings': checkboxColorMappingsTransform,
  'components/checkbox/semantic-enhancement': checkboxSemanticEnhancementTransform,
  'components/checkbox/add-semantic-colors': checkboxAddSemanticColorsTransform,
  'components/radio/color-mappings': radioColorMappingsTransform,
  'components/radio/semantic-enhancement': radioSemanticEnhancementTransform,
  'components/radio/add-semantic-colors': radioAddSemanticColorsTransform,
  'components/switch/color-mappings': switchColorMappingsTransform,
  'components/switch/semantic-enhancement': switchSemanticEnhancementTransform,
  'components/switch/add-semantic-colors': switchAddSemanticColorsTransform,
  'components/text/semantic-enhancement': textSemanticEnhancementTransform,
  'components/link/semantic-enhancement': linkSemanticEnhancementTransform,
  'components/input/color-mappings': inputColorMappingsTransform,
  'components/input/semantic-enhancement': inputSemanticEnhancementTransform,
  'components/fieldset/color-mappings': fieldsetColorMappingsTransform,
  'components/fieldset/semantic-enhancement': fieldsetSemanticEnhancementTransform,
  'components/dropdown/color-mappings': dropdownColorMappingsTransform,
  'components/dropdown/semantic-enhancement': dropdownSemanticEnhancementTransform,
  'components/combobox/color-mappings': comboboxColorMappingsTransform,
  'components/combobox/semantic-enhancement': comboboxSemanticEnhancementTransform,
  'components/listbox/color-mappings': listboxColorMappingsTransform,
  'components/table/color-mappings': tableColorMappingsTransform,
  'components/select/color-mappings': selectColorMappingsTransform,
  'components/textarea/color-mappings': textareaColorMappingsTransform,
  'components/navbar/color-mappings': navbarColorMappingsTransform,
  'components/navbar/semantic-enhancement': navbarSemanticEnhancementTransform,
  'components/alert/color-mappings': alertColorMappingsTransform,
  'components/alert/semantic-enhancement': alertSemanticEnhancementTransform,
  'components/dialog/semantic-enhancement': dialogSemanticEnhancementTransform,
  'components/table/semantic-enhancement': tableSemanticEnhancementTransform,
  // Duplicate entries removed - these are already mapped above
  'components/sidebar/edge-cases': sidebarEdgeCasesTransform,

  // Missing semantic enhancements
  'components/listbox/semantic-enhancement': listboxSemanticEnhancementTransform,
  'components/select/semantic-enhancement': selectSemanticEnhancementTransform,
  'components/sidebar/semantic-enhancement': sidebarSemanticEnhancementTransform,
  'components/textarea/semantic-enhancement': textareaSemanticEnhancementTransform,

  // Missing color mappings
  'components/link/color-mappings': linkColorMappingsTransform,
  'components/text/color-mappings': textColorMappingsTransform,
  'components/sidebar/color-mappings': sidebarColorMappingsTransform,
  'components/dialog/color-mappings': dialogColorMappingsTransform,
  'components/avatar/color-mappings': avatarColorMappingsTransform,
  'components/divider/color-mappings': dividerColorMappingsTransform,
  'components/pagination/color-mappings': paginationColorMappingsTransform,
  'components/sidebar-layout/color-mappings': sidebarLayoutColorMappingsTransform,
  'components/stacked-layout/color-mappings': stackedLayoutColorMappingsTransform,
  'components/auth-layout/color-mappings': authLayoutColorMappingsTransform,
  'components/description-list/color-mappings': descriptionListColorMappingsTransform,
  'components/heading/color-mappings': headingColorMappingsTransform,

  // Additional semantic enhancement transforms
  'components/avatar/semantic-enhancement': avatarSemanticEnhancementTransform,
  'components/divider/semantic-enhancement': dividerSemanticEnhancementTransform,
  'components/pagination/semantic-enhancement': paginationSemanticEnhancementTransform,
  'components/sidebar-layout/semantic-enhancement': sidebarLayoutSemanticEnhancementTransform,
  'components/stacked-layout/semantic-enhancement': stackedLayoutSemanticEnhancementTransform,
  'components/auth-layout/semantic-enhancement': authLayoutSemanticEnhancementTransform,
  'components/description-list/semantic-enhancement': descriptionListSemanticEnhancementTransform,
  'components/heading/semantic-enhancement': headingSemanticEnhancementTransform,

  // Default color update transforms
  'common/semantic-tokens/update-defaults/button': buttonDefaultColorTransform,
  'common/semantic-tokens/update-defaults/badge': badgeDefaultColorTransform,
  'common/semantic-tokens/update-defaults/checkbox': checkboxDefaultColorTransform,
  'common/semantic-tokens/update-defaults/radio': radioDefaultColorTransform,
  'common/semantic-tokens/update-defaults/switch': switchDefaultColorTransform,
}

interface PipelineOptions {
  srcDir?: string
  outDir?: string
  verbose?: boolean
  dryRun?: boolean
  skipTransforms?: boolean
  enabledTransforms?: string[]
  disabledTransforms?: string[]
}

/**
 * Check if a transform should be run based on configuration
 */
function shouldRunTransform(
  transformPath: string,
  componentName: string | null,
  options: PipelineOptions
): boolean {
  const { enabledTransforms, disabledTransforms } = options

  // If there are enabled transforms, only run those
  if (enabledTransforms && enabledTransforms.length > 0) {
    // Check exact match first
    if (enabledTransforms.includes(transformPath)) return true

    // Check component name match
    if (componentName && enabledTransforms.includes(componentName)) return true

    // Not in enabled list
    return false
  }

  // If there are disabled transforms, skip those
  if (disabledTransforms && disabledTransforms.length > 0) {
    // Check exact match first
    if (disabledTransforms.includes(transformPath)) return false

    // Check component name match
    if (componentName && disabledTransforms.includes(componentName)) return false
  }

  // Default: run the transform
  return true
}

/**
 * Run a single transform on a file
 */
async function runTransform(
  filePath: string,
  transform: Transform,
  options: PipelineOptions
): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const result = transform.execute(content, options)

    if (result.hasChanges && !options.dryRun) {
      await writeFile(filePath, result.content, 'utf-8')

      if (options.verbose) {
        console.log(chalk.gray(`  • ${transform.name}: ${result.changes.length} changes`))
      }
    }

    return result.hasChanges
  } catch (error) {
    // Only log errors that are not non-critical AST parsing warnings
    if (!isNonCriticalASTError(error)) {
      console.error(chalk.red(`Error in transform ${transform.name} on ${filePath}:`), error)
    }
    return false
  }
}

/**
 * Run transforms on all component files
 */
async function runTransformsOnFiles(
  phase: TransformPhase,
  srcDir: string,
  options: PipelineOptions
): Promise<string[]> {
  const files = await readdir(srcDir)
  const tsxFiles = files.filter((f) => f.endsWith('.tsx'))
  const changedFilePaths: string[] = []

  // Handle wildcard paths like 'components/*/semantic-enhancement'
  if (phase.path.includes('*/')) {
    // Extract the pattern type (e.g., 'semantic-enhancement', 'color-mappings')
    const patternType = phase.path.split('/').pop()!

    // List of all 27 component names
    const components = [
      'alert',
      'auth-layout',
      'avatar',
      'badge',
      'button',
      'checkbox',
      'combobox',
      'description-list',
      'dialog',
      'divider',
      'dropdown',
      'fieldset',
      'heading',
      'input',
      'link',
      'listbox',
      'navbar',
      'pagination',
      'radio',
      'select',
      'sidebar',
      'sidebar-layout',
      'stacked-layout',
      'switch',
      'table',
      'text',
      'textarea',
    ]

    if (options.verbose) {
      console.log(chalk.gray(`  🔍 Looking for ${patternType} transforms...`))
    }

    // Run the appropriate transform for each component
    for (const component of components) {
      const transformPath = `components/${component}/${patternType}`
      const componentTransform = TRANSFORM_MAP[transformPath]

      if (componentTransform) {
        // Check if transform should run based on configuration
        if (!shouldRunTransform(transformPath, component, options)) {
          if (options.verbose) {
            console.log(chalk.gray(`  ⏭️  Skipping disabled transform: ${transformPath}`))
          }
          continue
        }

        if (options.verbose) {
          console.log(chalk.gray(`  ✅ Found transform: ${transformPath}`))
        }
        for (const file of tsxFiles) {
          const filePath = join(srcDir, file)
          const changed = await runTransform(filePath, componentTransform, options)
          if (changed) changedFilePaths.push(filePath)
        }
      } else if (options.verbose) {
        console.log(chalk.gray(`  ❌ Missing transform: ${transformPath}`))
      }
    }
  } else {
    // Handle non-wildcard paths - direct transform lookup
    const transform = TRANSFORM_MAP[phase.path]

    if (!transform) {
      if (options.verbose && !phase.optional) {
        console.log(chalk.yellow(`  ⚠ Transform not implemented: ${phase.path}`))
      }
      return []
    }

    // Check if transform should run based on configuration
    if (!shouldRunTransform(phase.path, null, options)) {
      if (options.verbose) {
        console.log(chalk.gray(`  ⏭️  Skipping disabled transform: ${phase.path}`))
      }
      return []
    }

    // Apply to all files
    for (const file of tsxFiles) {
      const filePath = join(srcDir, file)
      const changed = await runTransform(filePath, transform, options)
      if (changed) changedFilePaths.push(filePath)
    }
  }

  return changedFilePaths
}

/**
 * Run external tools (oxlint and prettier)
 */
async function runExternalTools(srcDir: string, options: PipelineOptions): Promise<void> {
  if (options.dryRun) {
    console.log(chalk.gray('  • Skipping external tools in dry-run mode'))
    return
  }

  const { execa } = await import('execa')

  // Run oxlint --fix (silently)
  try {
    await execa('npx', ['oxlint', '--fix', srcDir], { stdio: 'pipe' })
    if (options.verbose) {
      console.log(chalk.green('  ✓ Ran oxlint --fix'))
    }
  } catch (_error) {
    // Silently continue - linter warnings are expected and don't affect transform functionality
    if (options.verbose) {
      console.warn(chalk.yellow('  ⚠ oxlint had warnings, continuing...'))
    }
  }

  // Run prettier (silently)
  try {
    await execa('npx', ['prettier', '--write', `${srcDir}/*.tsx`], { stdio: 'pipe' })
    if (options.verbose) {
      console.log(chalk.green('  ✓ Ran prettier'))
    }
  } catch (_error) {
    // Silently continue - prettier issues don't affect core functionality
    if (options.verbose) {
      console.warn(chalk.yellow('  ⚠ prettier had issues, continuing...'))
    }
  }
}

/**
 * Main pipeline execution
 */
export async function runMainPipeline(options: PipelineOptions = {}): Promise<void> {
  const {
    srcDir = join(process.cwd(), 'src/components/lib'),
    outDir = srcDir,
    verbose = true,
    dryRun = false,
    skipTransforms = false,
  } = options

  console.log(chalk.blue('🔄 Starting Catalyst to Semantic transformation pipeline'))

  try {
    // If skipTransforms is true, stop here
    if (skipTransforms) {
      console.log(chalk.yellow('\n⚠️  Skipping all transformations as requested'))
      return
    }

    // Step 1: Execute transforms in order
    const modifiedFiles = new Set<string>()

    for (const phase of TRANSFORM_ORDER) {
      if (verbose) {
        console.log(chalk.gray(`\n📍 Running ${phase.path} (${phase.type})`))
      }

      const changedFilePaths = await runTransformsOnFiles(phase, outDir, options)
      changedFilePaths.forEach((filePath) => modifiedFiles.add(filePath))
    }

    // Step 2: Run external tools
    if (!dryRun) {
      console.log(chalk.gray('\n🔧 Running external tools...'))
      await runExternalTools(outDir, options)
    }

    // Summary
    console.log(chalk.green(`\n✅ Pipeline complete! Modified ${modifiedFiles.size} files`))
  } catch (error) {
    console.error(chalk.red('❌ Pipeline failed:'), error)
    throw error
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runMainPipeline({
    verbose: true,
    dryRun: process.argv.includes('--dry-run'),
  }).catch(console.error)
}
