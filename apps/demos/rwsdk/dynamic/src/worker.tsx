import { defineApp } from 'rwsdk/worker'
import { render, route, layout } from 'rwsdk/router'

import { Document } from '@/app/Document'
import { setCommonHeaders } from '@/app/headers'

// Layout imports
import { ApplicationLayoutWrapper } from '@/app/application-layout.server'
import { AuthLayout } from '@/app/components/auth-layout'

// Page imports
import { Home } from '@/app/pages/Home'

// Auth pages
import { Login } from '@/app/pages/auth/login'
import { Register } from '@/app/pages/auth/register'
import { ForgotPassword } from '@/app/pages/auth/forgot-password'

// Event pages
import Events from '@/app/pages/events/index'
import Event from '@/app/pages/events/event'

// Order pages
import Orders from '@/app/pages/orders/index'
import Order from '@/app/pages/orders/order'

// Settings pages
import { Settings } from '@/app/pages/settings/index'

export type AppContext = {}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx
  },
  render(Document, [
    // App routes with ApplicationLayout
    layout(ApplicationLayoutWrapper, [
      route('/', Home),
      route('/events', Events),
      route('/events/:id', Event),
      route('/orders', Orders),
      route('/orders/:id', Order),
      route('/settings', Settings),
    ]),

    // Auth routes with AuthLayout
    layout(AuthLayout, [
      route('/auth/login', Login),
      route('/auth/register', Register),
      route('/auth/forgot-password', ForgotPassword),
    ]),
  ]),
])
