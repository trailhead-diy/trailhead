import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

export const authLayoutSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'AuthLayout',
  detectPattern: (content) =>
    content.includes('AuthLayout') && content.includes('export function AuthLayout'),
  defaultColor: 'zinc',
  typePattern: 'prop',
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})

// Legacy export for compatibility
export const authLayoutSemanticEnhancement = {
  component: 'auth-layout',
  enhance: (colorClass: string, element?: string, _state?: string): string | null => {
    // Form container enhancements
    if (element === 'form-container' && colorClass.includes('bg-')) {
      if (colorClass.includes('white')) return 'bg-card'
      if (colorClass.includes('950')) return 'bg-card'
    }

    // Background panel enhancements
    if (element === 'background-panel' && colorClass.includes('bg-')) {
      if (colorClass.includes('50')) return 'bg-muted/5'
      if (colorClass.includes('900')) return 'bg-muted'
    }

    // Border enhancements for cards
    if (element === 'card' && colorClass.includes('border-')) {
      return 'border-border'
    }

    // Shadow enhancements
    if (colorClass.includes('shadow-') && colorClass.includes('/5')) {
      return 'shadow-sm'
    }

    return null
  },
  attributesToAdd: [],
  transformImports: true,
}
