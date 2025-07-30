import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Trailhead UI - Preset</title>
        {/* Load theme before body renders to prevent flash */}
        <script src="/theme-init.js" />
      </head>
      <body className="text-base-950 antialiased lg:bg-base-100 dark:bg-base-900 dark:text-white dark:lg:bg-base-950">
        {children}
      </body>
    </html>
  )
}
