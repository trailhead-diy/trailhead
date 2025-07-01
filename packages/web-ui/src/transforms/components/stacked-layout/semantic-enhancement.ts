import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

export const stackedLayoutSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'StackedLayout',
  detectPattern: (content) =>
    content.includes('StackedLayout') && content.includes('export function StackedLayout'),
  defaultColor: 'zinc',
  typePattern: 'prop',
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})

// Legacy export for compatibility
export const stackedLayoutSemanticEnhancement = {
  component: 'stacked-layout',
  enhance: (colorClass: string, element?: string, _state?: string): string | null => {
    // Header/footer background enhancements
    if ((element === 'header' || element === 'footer') && colorClass.includes('bg-')) {
      if (colorClass.includes('950')) return 'bg-background'
      if (colorClass.includes('900')) return 'bg-muted/10'
    }

    // Content area enhancements
    if (element === 'content' && colorClass.includes('bg-')) {
      if (colorClass.includes('50')) return 'bg-background'
      if (colorClass.includes('100')) return 'bg-muted/5'
    }

    // Divider enhancements
    if (colorClass.includes('divide-')) {
      if (colorClass.includes('200')) return colorClass.replace(/200/g, 'border')
      if (colorClass.includes('300')) return colorClass.replace(/300/g, 'border')
    }

    // Border enhancements
    if (colorClass.includes('border-')) {
      if (colorClass.includes('200')) return 'border-border'
      if (colorClass.includes('300')) return 'border-border'
    }

    return null
  },
  attributesToAdd: [],
  transformImports: true,
}
