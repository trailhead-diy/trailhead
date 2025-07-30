import { RequestInfo } from 'rwsdk/worker'
import { Logo } from '@/app/logo'
import { Button } from '@/app/components/button'
import { Checkbox, CheckboxField } from '@/app/components/checkbox'
import { Field, Label } from '@/app/components/fieldset'
import { Heading } from '@/app/components/heading'
import { Input } from '@/app/components/input'
import { Strong, Text, TextLink } from '@/app/components/text'

export function Login({ ctx }: RequestInfo) {
  return (
    <>
      <meta property="og:title" content="Login" />
      <form action="" method="POST" className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-base-950 dark:text-base-50 forced-colors:text-[CanvasText]" />
        <Heading>Sign in to your account</Heading>
        <Field>
          <Label>Email</Label>
          <Input type="email" name="email" />
        </Field>
        <Field>
          <Label>Password</Label>
          <Input type="password" name="password" />
        </Field>
        <div className="flex items-center justify-between">
          <CheckboxField>
            <Checkbox name="remember" />
            <Label>Remember me</Label>
          </CheckboxField>
          <Text>
            <TextLink href="/forgot-password">
              <Strong>Forgot password?</Strong>
            </TextLink>
          </Text>
        </div>
        <Button type="submit" className="w-full">
          Login
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
