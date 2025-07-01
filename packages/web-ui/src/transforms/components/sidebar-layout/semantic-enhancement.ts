import { createSemanticEnhancementTransform } from '../common/semantic-tokens/utilities/transform-factory.js'

export const sidebarLayoutSemanticEnhancementTransform = createSemanticEnhancementTransform({
  name: 'SidebarLayout',
  detectPattern: (content) =>
    content.includes('SidebarLayout') && content.includes('export function SidebarLayout'),
  defaultColor: 'zinc',
  typePattern: 'prop',
  hasColorsObject: false,
  variableName: 'resolvedColorClasses',
  useIIFE: false,
})

// Legacy export for compatibility
export const sidebarLayoutSemanticEnhancement = {
  component: 'sidebar-layout',
  enhance: (colorClass: string, element?: string, state?: string): string | null => {
    // Sidebar background enhancements
    if (element === 'sidebar' && colorClass.includes('bg-')) {
      if (colorClass.includes('950')) return 'bg-muted/5'
      if (colorClass.includes('900')) return 'bg-muted/10'
    }

    // Navigation item states
    if (element === 'nav-item') {
      if (state === 'hover' && colorClass.includes('bg-')) {
        return 'hover:bg-primary/10'
      }
      if (state === 'active' && colorClass.includes('bg-')) {
        return 'bg-primary/20'
      }
    }

    // Border enhancements
    if (colorClass.includes('border-') || colorClass.includes('divide-')) {
      if (colorClass.includes('200')) return colorClass.replace(/200/g, 'border')
      if (colorClass.includes('300')) return colorClass.replace(/300/g, 'border')
    }

    return null
  },
  attributesToAdd: [],
  transformImports: true,
}
