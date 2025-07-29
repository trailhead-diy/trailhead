import type { LayoutProps } from 'rwsdk/router'
import { getEvents } from '@/data'
import { ApplicationLayout } from './application-layout'

export async function ApplicationLayoutWrapper({ children, requestInfo }: LayoutProps) {
  const events = await getEvents()

  return (
    <ApplicationLayout events={events} pathname={new URL(requestInfo.request.url).pathname}>
      {children}
    </ApplicationLayout>
  )
}
