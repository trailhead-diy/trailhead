import styles from './preset.css?url'

interface DocumentProps {
  children: React.ReactNode
}

export const Document: React.FC<DocumentProps> = ({ children }) => {
  return (
    <html
      lang="en"
      className="text-base-950 antialiased lg:bg-base-100 dark:bg-base-900 dark:text-white dark:lg:bg-base-950"
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Trailhead UI - Preset</title>
        <script src="theme-init.js" type="module"></script>
        <link href={styles} rel="stylesheet" />
      </head>
      <body>
        <div id="root">{children}</div>
        <script>import("/src/client.tsx")</script>
      </body>
    </html>
  )
}
