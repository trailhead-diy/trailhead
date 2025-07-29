import { RequestInfo } from 'rwsdk/worker'
import { Logo } from '@/app/logo'
import { Button } from '@/app/components/button'
import { Field, Label } from '@/app/components/fieldset'
import { Heading } from '@/app/components/heading'
import { Input } from '@/app/components/input'
import { Strong, Text, TextLink } from '@/app/components/text'

export function ForgotPassword({ ctx }: RequestInfo) {
  return (
    <>
      <meta property="og:title" content="Forgot password" />
      <form action="" method="POST" className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-base-950 dark:text-base-50 forced-colors:text-[CanvasText]" />
        <Heading>Reset your password</Heading>
        <Text>Enter your email and we’ll send you a link to reset your password.</Text>
        <Field>
          <Label>Email</Label>
          <Input type="email" name="email" />
        </Field>
        <Button type="submit" className="w-full">
          Reset password
        </Button>
        <Text>
          Don’t have an account?{' '}
          <TextLink href="/register">
            <Strong>Sign up</Strong>
          </TextLink>
        </Text>
      </form>
    </>
  )
}
