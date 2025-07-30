import styles from './styles.css?url'
import { Initializer, getServerTheme } from '@/app/components/theme'

interface DocumentProps {
  children: React.ReactNode
}

export const Document: React.FC<DocumentProps> = ({ children }) => {
  // rwsdk doesn't pass requestInfo to Document components yet
  // Using client-side theme application via theme-init.js to prevent flash
  const { className: themeClassName } = getServerTheme(null)

  // Combine theme class with existing classes
  const htmlClassName = `${themeClassName} text-base-950 antialiased lg:bg-base-100 dark:bg-base-900 dark:text-white dark:lg:bg-base-950`

  return (
    <html lang="en" className={htmlClassName}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Trailhead UI - RedwoodJS SDK Demo</title>

        {/* Preload critical resources */}
        <link rel="preload" href="/theme-init.js" as="script" />
        <link rel="preload" href={styles} as="style" />
        <link
          rel="preload"
          href="https://rsms.me/inter/inter.css"
          as="style"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://rsms.me/" />
        <link rel="preconnect" href="https://rsms.me/" crossOrigin="anonymous" />

        {/* Apply styles */}
        <link href={styles} rel="stylesheet" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />

        {/* Theme initialization script - high priority */}
        <script src="/theme-init.js"></script>

        {/* Preload the main client module */}
        <link rel="modulepreload" href="/src/client.tsx" />

        {/* Additional performance hints */}
        <link rel="prefetch" href="/src/client.tsx" />
      </head>
      <body>
        <div id="root">
          <Initializer />
          {children}
        </div>
        <script>import("/src/client.tsx")</script>
      </body>
    </html>
  )
}
