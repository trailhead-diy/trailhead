#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * gcwm-auto Demo
 *
 * This example demonstrates how to use the dependency analysis package
 * to automatically create atomic commits based on file dependencies.
 *
 * Usage: tsx examples/gcwm-auto-demo.ts
 */

import {
  createGitOperations,
  createGitStatusOperations,
  createGitCommandOperations,
  createGitLogOperations,
  createGitStashOperations,
  createGitStagingOperations,
} from '@esteban-url/git'
import {
  createDependencyAnalysisEngine,
  analyzeGitChanges,
  createAtomicCommits,
  type GitContext,
  type AnalysisOptions,
} from '@esteban-url/dependency-analysis'
import { globalProfiler } from '@esteban-url/dependency-analysis/core'

async function main() {
  console.log('🚀 gcwm-auto Demo - Intelligent Atomic Commit Creation\n')

  // 1. Initialize Git operations
  const gitOps = createGitOperations()
  const repoResult = await gitOps.open(process.cwd())

  if (!repoResult.isOk()) {
    console.error('❌ Error: Not in a git repository')
    process.exit(1)
  }

  const repository = repoResult.value

  // Create the git context with all needed operations
  const gitContext: GitContext = {
    repository,
    status: createGitStatusOperations(),
    commands: createGitCommandOperations(),
    log: createGitLogOperations(),
    stash: createGitStashOperations(),
    staging: createGitStagingOperations(),
  }

  // 2. Analyze current git changes
  console.log('📊 Analyzing git changes...')
  const changesResult = await analyzeGitChanges(gitContext)

  if (!changesResult.isOk()) {
    console.error('❌ Error analyzing changes:', changesResult.error.message)
    process.exit(1)
  }

  const changes = changesResult.value
  console.log(`Found ${changes.length} changed files\n`)

  if (changes.length === 0) {
    console.log('✨ No changes to commit!')
    process.exit(0)
  }

  // 3. Create dependency analysis engine
  const engine = createDependencyAnalysisEngine()

  // 4. Analyze dependencies and group changes
  const analysisOptions: AnalysisOptions = {
    mode: 'auto', // Let the engine decide simple vs complex
    excludeFiles: ['package-lock.json', 'yarn.lock'], // Exclude lock files
    preferSimpleGrouping: false,
    validationCommands: ['pnpm lint', 'pnpm types'],
  }

  console.log('🔍 Analyzing dependencies and grouping changes...')
  const analysisResult = await engine.analyzeChanges(changes, analysisOptions)

  if (!analysisResult.isOk()) {
    console.error('❌ Error during analysis:', analysisResult.error.message)
    process.exit(1)
  }

  const analysis = analysisResult.value
  console.log(`\n📋 Analysis Results:`)
  console.log(`- Mode: ${analysis.mode}`)
  console.log(`- Total files: ${analysis.totalFiles}`)
  console.log(`- Groups created: ${analysis.groups.length}`)
  console.log(`- Estimated time: ${analysis.estimatedTime}`)

  if (analysis.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`)
    analysis.warnings.forEach((w) => console.log(`  - ${w}`))
  }

  // 5. Display the proposed atomic commits
  console.log(`\n🎯 Proposed Atomic Commits:`)
  analysis.groups.forEach((group, index) => {
    console.log(`\n${index + 1}. ${group.description}`)
    console.log(`   Risk: ${group.estimatedRisk}`)
    console.log(`   Files (${group.files.length}):`)
    group.files.forEach((f) => console.log(`     - ${f}`))
    if (group.validationCommands.length > 0) {
      console.log(`   Validation: ${group.validationCommands.join(', ')}`)
    }
  })

  // 6. Ask for confirmation (in a real CLI, you'd use prompts)
  console.log('\n🤔 Would you like to create these commits? (dry-run mode)')

  // 7. Create the atomic commits (dry-run)
  const commitOptions = {
    dryRun: true, // Set to false to actually create commits
    stashChanges: false, // Set to true to stash uncommitted changes
    validateEachCommit: false, // Set to true to run validation after each commit
    conventionalCommitFormat: true, // Use conventional commit format
  }

  console.log('\n🏃 Creating atomic commits (dry-run)...')
  const commitResult = await createAtomicCommits(gitContext, analysis.groups, commitOptions)

  if (!commitResult.isOk()) {
    console.error('❌ Error creating commits:', commitResult.error.message)
    process.exit(1)
  }

  const commits = commitResult.value
  console.log(`\n✅ Successfully created ${commits.length} atomic commits (dry-run)`)

  commits.forEach((commit, index) => {
    console.log(`\n${index + 1}. ${commit.group.description}`)
    console.log(`   Commit ID: ${commit.commitId}`)
    console.log(`   Validation: ${commit.validationPassed ? '✅ Passed' : '❌ Failed'}`)
  })

  console.log('\n🎉 Demo complete! Set dryRun: false to actually create commits.')

  // Display performance profiling summary
  if (process.env.DEPENDENCY_ANALYSIS_DEBUG === 'true') {
    console.log('\n📊 Performance Profile:')
    console.log(globalProfiler.summary())
  }
}

// Run the demo
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
