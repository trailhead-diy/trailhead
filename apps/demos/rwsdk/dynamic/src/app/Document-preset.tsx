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
        <title>Trailhead UI - RedwoodJS SDK Demo</title>

        {/* Styles */}
        <link href={styles} rel="stylesheet" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />

        {/* 
          Minimal script for system dark mode preference.
          This runs before paint, preventing flash.
          For manual toggle, remove this and use the toggle component.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />

        {/* Preload */}
        <link rel="modulepreload" href="/src/client.tsx" />
      </head>
      <body>
        <div id="root">{children}</div>
        <script type="module" src="/src/client.tsx"></script>
      </body>
    </html>
  )
}
