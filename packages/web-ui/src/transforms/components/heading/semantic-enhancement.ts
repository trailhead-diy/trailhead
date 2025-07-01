import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

export const headingSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'Heading',
  detectPattern: (content) =>
    content.includes('Heading') && content.includes('export function Heading'),
  defaultColor: 'zinc',
  typePattern: 'prop',
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})

// Legacy export for compatibility
export const headingSemanticEnhancement = {
  component: 'heading',
  enhance: (colorClass: string, element?: string, _state?: string): string | null => {
    // Main heading enhancements
    if (element === 'h1' || element === 'h2' || element === 'h3') {
      if (
        colorClass.includes('text-') &&
        (colorClass.includes('900') || colorClass.includes('950'))
      ) {
        return 'text-foreground'
      }
    }

    // Subheading enhancements
    if (element === 'subheading' || element === 'h4' || element === 'h5' || element === 'h6') {
      if (
        colorClass.includes('text-') &&
        (colorClass.includes('600') || colorClass.includes('700'))
      ) {
        return 'text-foreground/90'
      }
      if (
        colorClass.includes('text-') &&
        (colorClass.includes('500') || colorClass.includes('400'))
      ) {
        return 'text-muted-foreground'
      }
    }

    // Gradient text enhancements (if any)
    if (colorClass.includes('from-') || colorClass.includes('to-')) {
      if (colorClass.includes('zinc')) {
        return colorClass.replace(/zinc-\d+/g, 'foreground')
      }
    }

    return null
  },
  attributesToAdd: [],
  transformImports: true,
}
