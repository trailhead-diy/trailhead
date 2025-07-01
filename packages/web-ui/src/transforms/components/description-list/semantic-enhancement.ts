import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

export const descriptionListSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'DescriptionList',
  detectPattern: (content) =>
    content.includes('DescriptionList') && content.includes('export function DescriptionList'),
  defaultColor: 'zinc',
  typePattern: 'prop',
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})

// Legacy export for compatibility
export const descriptionListSemanticEnhancement = {
  component: 'description-list',
  enhance: (colorClass: string, element?: string, state?: string): string | null => {
    // Term (dt) enhancements
    if (element === 'term' && colorClass.includes('text-')) {
      if (colorClass.includes('500') || colorClass.includes('600')) {
        return 'text-muted-foreground'
      }
    }

    // Description (dd) enhancements
    if (element === 'description' && colorClass.includes('text-')) {
      if (colorClass.includes('900') || colorClass.includes('950')) {
        return 'text-foreground'
      }
    }

    // Grid/striped background enhancements
    if (element === 'grid-row' && state === 'even' && colorClass.includes('bg-')) {
      return 'bg-muted/5'
    }

    // Border enhancements for divided lists
    if (colorClass.includes('divide-')) {
      if (colorClass.includes('100') || colorClass.includes('200')) {
        return 'divide-border'
      }
    }

    return null
  },
  attributesToAdd: [],
  transformImports: true,
}
