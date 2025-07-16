'use client'
import React from 'react'
import { ThemeProvider } from '@/app/components/th/theme/theme-provider'

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="catalyst">{children}</ThemeProvider>
)
