/**
 * Transform logging system for tracking all changes made during transformation
 * Enables comprehensive change tracking and easy revert functionality
 */

import { writeFile, mkdir } from 'fs/promises'
import { join, basename } from 'path'
import { existsSync } from 'fs'

export interface TransformChange {
  /** The original text that was replaced */
  from: string
  /** The new text that replaced the original */
  to: string
  /** Line number where the change occurred (if available) */
  line?: number
  /** Column number where the change occurred (if available) */
  column?: number
  /** Type of change (regex, ast, etc.) */
  type: 'regex' | 'ast' | 'manual'
  /** Additional context about the change */
  context?: string
}

export interface FileTransformLog {
  /** Path to the file that was transformed */
  filePath: string
  /** Name of the transform that was applied */
  transformName: string
  /** Description of what the transform does */
  transformDescription: string
  /** Type of transform (regex, ast, etc.) */
  transformType: 'regex' | 'ast' | 'manual'
  /** Timestamp when the transform was applied */
  timestamp: string
  /** Original file content before transformation */
  originalContent: string
  /** File content after transformation */
  transformedContent: string
  /** List of individual changes made */
  changes: TransformChange[]
  /** Whether the transform made any changes */
  hasChanges: boolean
}

export interface TransformSession {
  /** Unique identifier for this transform session */
  sessionId: string
  /** Timestamp when the session started */
  startTime: string
  /** Timestamp when the session ended */
  endTime?: string
  /** Configuration options used for this session */
  options: any
  /** List of all file transformations in this session */
  fileTransforms: FileTransformLog[]
  /** Summary statistics */
  summary: {
    totalFiles: number
    filesChanged: number
    totalChanges: number
    transformsApplied: string[]
  }
}

class TransformLogger {
  private currentSession: TransformSession | null = null
  private logDir: string = 'transform-logs'

  /**
   * Start a new transform session
   */
  async startSession(options: any = {}): Promise<string> {
    const sessionId = `transform-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    this.currentSession = {
      sessionId,
      startTime: new Date().toISOString(),
      options,
      fileTransforms: [],
      summary: {
        totalFiles: 0,
        filesChanged: 0,
        totalChanges: 0,
        transformsApplied: [],
      },
    }

    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      await mkdir(this.logDir, { recursive: true })
    }

    console.log(`📝 Started transform logging session: ${sessionId}`)
    return sessionId
  }

  /**
   * Log a file transformation
   */
  logFileTransform(
    filePath: string,
    transformName: string,
    transformDescription: string,
    transformType: 'regex' | 'ast' | 'manual',
    originalContent: string,
    transformedContent: string,
    changes: TransformChange[]
  ): void {
    if (!this.currentSession) {
      throw new Error('No active transform session. Call startSession() first.')
    }

    const hasChanges = changes.length > 0

    const fileLog: FileTransformLog = {
      filePath,
      transformName,
      transformDescription,
      transformType,
      timestamp: new Date().toISOString(),
      originalContent,
      transformedContent,
      changes,
      hasChanges,
    }

    this.currentSession.fileTransforms.push(fileLog)

    // Update session summary
    this.currentSession.summary.totalFiles++
    if (hasChanges) {
      this.currentSession.summary.filesChanged++
      this.currentSession.summary.totalChanges += changes.length
    }

    if (!this.currentSession.summary.transformsApplied.includes(transformName)) {
      this.currentSession.summary.transformsApplied.push(transformName)
    }

    // Log the transformation
    if (hasChanges) {
      console.log(`  📄 ${basename(filePath)}: ${changes.length} changes by ${transformName}`)
      if (changes.length <= 5) {
        changes.forEach((change, index) => {
          const preview = change.from.length > 50 ? change.from.slice(0, 50) + '...' : change.from
          console.log(`    ${index + 1}. "${preview}" → semantic token`)
        })
      } else {
        console.log(`    • ${changes.length} changes (use log file for details)`)
      }
    }
  }

  /**
   * End the current session and save the log
   */
  async endSession(): Promise<string | null> {
    if (!this.currentSession) {
      return null
    }

    this.currentSession.endTime = new Date().toISOString()

    // Write detailed log to file
    const logFileName = `${this.currentSession.sessionId}.json`
    const logFilePath = join(this.logDir, logFileName)

    await writeFile(logFilePath, JSON.stringify(this.currentSession, null, 2), 'utf-8')

    // Write summary log (human readable)
    const summaryFileName = `${this.currentSession.sessionId}-summary.md`
    const summaryFilePath = join(this.logDir, summaryFileName)

    const summaryContent = this.generateSummaryMarkdown(this.currentSession)
    await writeFile(summaryFilePath, summaryContent, 'utf-8')

    console.log(`📊 Transform session complete:`)
    console.log(`  • Files processed: ${this.currentSession.summary.totalFiles}`)
    console.log(`  • Files changed: ${this.currentSession.summary.filesChanged}`)
    console.log(`  • Total changes: ${this.currentSession.summary.totalChanges}`)
    console.log(`  • Transforms applied: ${this.currentSession.summary.transformsApplied.length}`)
    console.log(`  • Log saved to: ${logFilePath}`)
    console.log(`  • Summary saved to: ${summaryFilePath}`)

    const sessionId = this.currentSession.sessionId
    this.currentSession = null

    return sessionId
  }

  /**
   * Generate a human-readable summary of the transform session
   */
  private generateSummaryMarkdown(session: TransformSession): string {
    const lines = [
      `# Transform Session Summary`,
      ``,
      `**Session ID**: ${session.sessionId}`,
      `**Start Time**: ${session.startTime}`,
      `**End Time**: ${session.endTime}`,
      `**Duration**: ${this.calculateDuration(session.startTime, session.endTime!)}`,
      ``,
      `## Summary`,
      ``,
      `- **Files Processed**: ${session.summary.totalFiles}`,
      `- **Files Changed**: ${session.summary.filesChanged}`,
      `- **Total Changes**: ${session.summary.totalChanges}`,
      `- **Transforms Applied**: ${session.summary.transformsApplied.length}`,
      ``,
      `## Transforms Applied`,
      ``,
      ...session.summary.transformsApplied.map((name) => `- ${name}`),
      ``,
      `## Files Changed`,
      ``,
    ]

    const changedFiles = session.fileTransforms.filter((f) => f.hasChanges)

    for (const fileLog of changedFiles) {
      lines.push(`### ${basename(fileLog.filePath)}`)
      lines.push(``)
      lines.push(`**Path**: ${fileLog.filePath}`)
      lines.push(`**Transform**: ${fileLog.transformName}`)
      lines.push(`**Description**: ${fileLog.transformDescription}`)
      lines.push(`**Changes**: ${fileLog.changes.length}`)
      lines.push(``)

      if (fileLog.changes.length > 0) {
        lines.push(`**Change Details**:`)
        lines.push(``)
        fileLog.changes.forEach((change, index) => {
          lines.push(`${index + 1}. \`${change.from}\` → \`${change.to}\``)
          if (change.context) {
            lines.push(`   - Context: ${change.context}`)
          }
        })
        lines.push(``)
      }
    }

    return lines.join('\n')
  }

  /**
   * Calculate duration between two ISO timestamps
   */
  private calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()

    const seconds = Math.floor(durationMs / 1000)
    const minutes = Math.floor(seconds / 60)

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Generate a revert script for a specific session
   * Applies reverts in reverse order to properly undo sequential transforms
   */
  async generateRevertScript(sessionId: string): Promise<string> {
    const logFilePath = join(this.logDir, `${sessionId}.json`)

    try {
      const logContent = await import(logFilePath)
      const session: TransformSession = logContent.default || logContent

      const scriptLines = [
        '#!/bin/bash',
        '# Auto-generated revert script for transform session',
        `# Session ID: ${sessionId}`,
        `# Generated: ${new Date().toISOString()}`,
        '# This script applies reverts in reverse order to properly undo sequential transforms',
        '',
        'set -e',
        '',
        'echo "Reverting transform session: ' + sessionId + '"',
        '',
      ]

      // Group all transforms by file
      const fileTransformMap = new Map<string, FileTransformLog[]>()

      for (const fileLog of session.fileTransforms) {
        if (!fileTransformMap.has(fileLog.filePath)) {
          fileTransformMap.set(fileLog.filePath, [])
        }
        fileTransformMap.get(fileLog.filePath)!.push(fileLog)
      }

      // For each file, apply reverts in reverse order
      for (const [filePath, logs] of fileTransformMap) {
        // Filter to only logs with changes and reverse the order
        const logsWithChanges = logs.filter((log) => log.hasChanges)

        if (logsWithChanges.length === 0) continue

        scriptLines.push(
          `echo "Reverting ${basename(filePath)} (${logsWithChanges.length} transforms)..."`
        )
        scriptLines.push(`# Backup current file`)
        scriptLines.push(`cp "${filePath}" "${filePath}.backup-$(date +%s)"`)

        // Create a temporary variable to track the current content
        scriptLines.push(`# Apply reverts in reverse order`)

        // We need to apply transforms in reverse: if we had A→B→C, we need to go C→B→A
        // The last transform's originalContent is what we had before that transform
        // So we start from the end and work backwards

        if (logsWithChanges.length === 1) {
          // Simple case: only one transform, just restore its original
          scriptLines.push(`# Single transform - restoring original content`)
          // Use base64 to preserve exact content including trailing newlines
          const encodedContent = Buffer.from(logsWithChanges[0].originalContent).toString('base64')
          scriptLines.push(`echo '${encodedContent}' | base64 -d > "${filePath}"`)
        } else {
          // Multiple transforms - need to apply them in reverse
          scriptLines.push(`# Multiple transforms - applying in reverse order`)

          // Start with the current file content
          let tempFileIndex = 0

          // Apply each revert in reverse order
          for (let i = logsWithChanges.length - 1; i >= 0; i--) {
            const log = logsWithChanges[i]
            scriptLines.push(``)
            scriptLines.push(
              `# Reverting transform ${i + 1}/${logsWithChanges.length}: ${log.transformName}`
            )

            if (i === 0) {
              // Last revert - use the first transform's original content
              // Use base64 to preserve exact content including trailing newlines
              const encodedContent = Buffer.from(log.originalContent).toString('base64')
              scriptLines.push(`echo '${encodedContent}' | base64 -d > "${filePath}"`)
            } else {
              // Intermediate revert - restore to the state before this transform
              // That state is stored in this transform's originalContent
              // Use base64 to preserve exact content including trailing newlines
              const encodedContent = Buffer.from(log.originalContent).toString('base64')
              scriptLines.push(
                `echo '${encodedContent}' | base64 -d > "${filePath}.tmp${tempFileIndex}"`
              )
              scriptLines.push(`mv "${filePath}.tmp${tempFileIndex}" "${filePath}"`)
              tempFileIndex++
            }
          }
        }

        scriptLines.push('')
      }

      scriptLines.push('echo "Revert complete!"')
      scriptLines.push(
        'echo "Files have been restored to their state before this transform session."'
      )

      const scriptContent = scriptLines.join('\n')
      const scriptPath = join(this.logDir, `revert-${sessionId}.sh`)

      await writeFile(scriptPath, scriptContent, 'utf-8')

      // Make script executable (Unix systems)
      try {
        const { exec } = await import('child_process')
        exec(`chmod +x "${scriptPath}"`)
      } catch {
        // Ignore chmod errors on non-Unix systems
      }

      return scriptPath
    } catch (error) {
      throw new Error(`Failed to generate revert script: ${error}`)
    }
  }
}

// Singleton instance
export const transformLogger = new TransformLogger()

/**
 * Helper function to extract changes from content diff
 * This is a simple implementation - can be enhanced with more sophisticated diffing
 */
export function extractChanges(
  originalContent: string,
  transformedContent: string,
  transformType: 'regex' | 'ast' | 'manual' = 'regex'
): TransformChange[] {
  if (originalContent === transformedContent) {
    return []
  }

  // Simple line-by-line diff for now
  const originalLines = originalContent.split('\n')
  const transformedLines = transformedContent.split('\n')
  const changes: TransformChange[] = []

  const maxLines = Math.max(originalLines.length, transformedLines.length)

  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || ''
    const transformedLine = transformedLines[i] || ''

    if (originalLine !== transformedLine) {
      // Simple heuristic: find changed parts within the line
      if (originalLine && transformedLine) {
        // Find the different part (this is a simplified approach)
        const change = findLineChanges(originalLine, transformedLine)
        if (change) {
          changes.push({
            from: change.from,
            to: change.to,
            line: i + 1,
            type: transformType,
            context: `Line ${i + 1}`,
          })
        }
      } else if (originalLine && !transformedLine) {
        // Line was removed
        changes.push({
          from: originalLine,
          to: '',
          line: i + 1,
          type: transformType,
          context: `Line ${i + 1} removed`,
        })
      } else if (!originalLine && transformedLine) {
        // Line was added
        changes.push({
          from: '',
          to: transformedLine,
          line: i + 1,
          type: transformType,
          context: `Line ${i + 1} added`,
        })
      }
    }
  }

  return changes
}

/**
 * Find changes within a single line (simplified implementation)
 */
function findLineChanges(
  originalLine: string,
  transformedLine: string
): { from: string; to: string } | null {
  // Very basic implementation - just return the whole lines if different
  // This could be enhanced with more sophisticated word-level or token-level diffing
  if (originalLine.trim() !== transformedLine.trim()) {
    return {
      from: originalLine.trim(),
      to: transformedLine.trim(),
    }
  }
  return null
}
