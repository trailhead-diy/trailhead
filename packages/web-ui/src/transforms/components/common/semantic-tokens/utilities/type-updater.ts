/**
 * Type updater utility for semantic token enhancements
 * Provides reusable functions for updating TypeScript types
 */

import type { API, Collection } from 'jscodeshift'

export interface TypeUpdateResult {
  hasChanges: boolean
  changes: any[]
}

/**
 * Update a Color type alias to include SemanticColorToken
 * Handles pattern: type Color = keyof typeof colors
 */
export function updateColorTypeAlias(
  root: Collection<any>,
  j: API['jscodeshift'],
  typeName: string = 'Color'
): TypeUpdateResult {
  const changes: any[] = []
  let hasChanges = false

  root.find(j.TSTypeAliasDeclaration, { id: { name: typeName } }).forEach((path) => {
    const typeAnnotation = path.node.typeAnnotation
    if (
      typeAnnotation?.type === 'TSTypeReference' &&
      typeAnnotation.typeName?.type === 'Identifier' &&
      typeAnnotation.typeName.name === 'keyof'
    ) {
      // Create union type with SemanticColorToken
      const newType = j.tsUnionType([
        typeAnnotation,
        j.tsTypeReference(j.identifier('SemanticColorToken')),
      ])
      path.node.typeAnnotation = newType
      hasChanges = true
      changes.push({
        type: 'type',
        description: `Updated ${typeName} type to include SemanticColorToken`,
      })
    }
  })

  return { hasChanges, changes }
}

/**
 * Add color prop to component props interface/type
 * Handles pattern: color?: keyof typeof colors | SemanticColorToken
 */
export function addColorPropToInterface(
  root: Collection<any>,
  j: API['jscodeshift'],
  interfaceName: string
): TypeUpdateResult {
  const changes: any[] = []
  let hasChanges = false

  // Find the interface/type and add color prop
  root.find(j.TSTypeAliasDeclaration, { id: { name: interfaceName } }).forEach((path) => {
    const typeAnnotation = path.node.typeAnnotation
    if (typeAnnotation?.type === 'TSIntersectionType') {
      // Add color property to intersection
      typeAnnotation.types.push(
        j.tsTypeLiteral([
          j.tsPropertySignature(
            j.identifier('color'),
            j.tsTypeAnnotation(
              j.tsUnionType([
                j.tsTypeReference(j.identifier('SemanticColorToken')),
                j.tsUndefinedKeyword(),
              ])
            ),
            true // optional
          ),
        ])
      )
      hasChanges = true
      changes.push({
        type: 'type',
        description: `Added color type to ${interfaceName}`,
      })
    }
  })

  return { hasChanges, changes }
}

/**
 * Update color prop type in an interface or object pattern
 * Handles updating existing color?: string to include SemanticColorToken
 */
export function updateColorPropType(
  root: Collection<any>,
  j: API['jscodeshift']
): TypeUpdateResult {
  const changes: any[] = []
  let hasChanges = false

  // Find color property signatures
  root.find(j.TSPropertySignature, { key: { name: 'color' } }).forEach((path) => {
    const typeAnnotation = path.node.typeAnnotation
    if (
      typeAnnotation?.typeAnnotation?.type === 'TSTypeReference' &&
      typeAnnotation.typeAnnotation.typeName?.type === 'Identifier' &&
      typeAnnotation.typeAnnotation.typeName.name === 'keyof'
    ) {
      // Create union type with SemanticColorToken
      const newType = j.tsUnionType([
        typeAnnotation.typeAnnotation,
        j.tsTypeReference(j.identifier('SemanticColorToken')),
      ])
      path.node.typeAnnotation = j.tsTypeAnnotation(newType)
      hasChanges = true
      changes.push({
        type: 'type',
        description: 'Updated color prop type to include SemanticColorToken',
      })
    }
  })

  return { hasChanges, changes }
}

/**
 * Add className and color props to inline type objects
 * Handles pattern: { children: React.ReactNode } -> { children: React.ReactNode; className?: string; color?: SemanticColorToken }
 */
export function addPropsToInlineType(
  root: Collection<any>,
  j: API['jscodeshift'],
  addClassName: boolean = true,
  addColor: boolean = false
): TypeUpdateResult {
  const changes: any[] = []
  let hasChanges = false

  // Find function parameters with inline type objects (both regular and export functions)
  root.find(j.FunctionDeclaration).forEach((funcPath) => {
    const params = funcPath.node.params
    if (params.length > 0 && params[0].type === 'ObjectPattern') {
      const param = params[0] as any
      if (param.typeAnnotation?.typeAnnotation?.type === 'TSTypeLiteral') {
        // Check if this function actually uses className parameter
        const hasClassNameParam = param.properties.some(
          (prop: any) => prop.type === 'ObjectProperty' && prop.key?.name === 'className'
        )

        // Only add to type if className parameter is actually being used
        if (hasClassNameParam || addColor) {
          const typeObject = param.typeAnnotation.typeAnnotation
          const members = typeObject.members

          // Check if className already exists
          const hasClassNameProp = members.some(
            (member: any) =>
              member.type === 'TSPropertySignature' && member.key?.name === 'className'
          )

          // Check if color already exists
          const hasColorProp = members.some(
            (member: any) => member.type === 'TSPropertySignature' && member.key?.name === 'color'
          )

          // Add className prop if needed and className param is used
          if (addClassName && hasClassNameParam && !hasClassNameProp) {
            members.push(
              j.tsPropertySignature(
                j.identifier('className'),
                j.tsTypeAnnotation(j.tsStringKeyword()),
                true // optional
              )
            )
            hasChanges = true
            changes.push({
              type: 'type',
              description: 'Added className prop to inline type',
            })
          }

          // Add color prop if needed
          if (addColor && !hasColorProp) {
            members.push(
              j.tsPropertySignature(
                j.identifier('color'),
                j.tsTypeAnnotation(
                  j.tsUnionType([
                    j.tsTypeReference(j.identifier('SemanticColorToken')),
                    j.tsUndefinedKeyword(),
                  ])
                ),
                true // optional
              )
            )
            hasChanges = true
            changes.push({
              type: 'type',
              description: 'Added color prop to inline type',
            })
          }
        }
      }
    }
  })

  return { hasChanges, changes }
}
