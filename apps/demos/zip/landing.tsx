'use client'

// For Next.js:
// import { Button } from '@/components/button'
// import { Badge } from '@/components/badge'
// import { Heading } from '@/components/heading'
// import { Text } from '@/components/text'
// import { ModeToggle } from '@/components/theme/mode-toggle'

// For RedwoodJS SDK:
import { Button } from '@/app/components/button'
import { Badge } from '@/app/components/badge'
import { Heading } from '@/app/components/heading'
import { Text } from '@/app/components/text'
import { ModeToggle } from '@/app/components/theme/mode-toggle'

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-base-200 bg-white/80 backdrop-blur-sm dark:border-base-800 dark:bg-base-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Heading level={3} className="font-bold">
            Trailhead UI - Preset
          </Heading>
          <div className="flex items-center gap-4">
            <Button plain>Features</Button>
            <Button plain>Pricing</Button>
            <Button color="primary">Get Started</Button>
            <ModeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-base-950 dark:via-base-900 dark:to-base-950">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <Badge color="primary" className="mb-4">
            New Feature
          </Badge>
          <Heading level={1} className="mb-6 text-5xl font-bold">
            Build Faster with <span className="text-primary">Preset Themes</span>
          </Heading>
          <Text className="mx-auto mb-8 max-w-2xl text-lg text-base-600 dark:text-base-400">
            Create beautiful, performant websites with zero JavaScript overhead for theming. Perfect
            for production applications that need speed and consistency.
          </Text>
          <div className="flex justify-center gap-4">
            <Button color="primary">Start Building</Button>
            <Button outline>View Documentation</Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4">
          <Heading level={2} className="mb-12 text-center text-3xl font-bold">
            Why Choose Preset Themes?
          </Heading>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-lg border border-base-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-base-800 dark:bg-base-900"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  {feature.icon}
                </div>
                <Heading level={3} className="mb-2 text-xl font-semibold">
                  {feature.title}
                </Heading>
                <Text className="text-base-600 dark:text-base-400">{feature.description}</Text>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    icon: '⚡',
    title: 'Zero JavaScript',
    description: 'No runtime theme switching means ~15KB smaller bundle and faster page loads.',
  },
  {
    icon: '🎨',
    title: 'Perfect Consistency',
    description: 'Colors are baked into CSS, ensuring consistent rendering across all browsers.',
  },
  {
    icon: '🚀',
    title: 'Production Ready',
    description: 'No hydration issues, no flash of unstyled content, just pure performance.',
  },
]
