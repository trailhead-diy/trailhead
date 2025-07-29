import { RequestInfo } from 'rwsdk/worker'
import { Logo } from '@/app/logo'
import { Button } from '@/app/components/button'
import { Checkbox, CheckboxField } from '@/app/components/checkbox'
import { Field, Label } from '@/app/components/fieldset'
import { Heading } from '@/app/components/heading'
import { Input } from '@/app/components/input'
import { Select } from '@/app/components/select'
import { Strong, Text, TextLink } from '@/app/components/text'

export function Register({ ctx }: RequestInfo) {
  return (
    <>
      <meta property="og:title" content="Register" />
      <form action="" method="POST" className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-base-950 dark:text-base-50 forced-colors:text-[CanvasText]" />
        <Heading>Create your account</Heading>
        <Field>
          <Label>Email</Label>
          <Input type="email" name="email" />
        </Field>
        <Field>
          <Label>Full name</Label>
          <Input name="name" />
        </Field>
        <Field>
          <Label>Password</Label>
          <Input type="password" name="password" autoComplete="new-password" />
        </Field>
        <Field>
          <Label>Country</Label>
          <Select name="country">
            <option>Canada</option>
            <option>Mexico</option>
            <option>United States</option>
          </Select>
        </Field>
        <CheckboxField>
          <Checkbox name="remember" />
          <Label>Get emails about product updates and news.</Label>
        </CheckboxField>
        <Button type="submit" className="w-full">
          Create account
        </Button>
        <Text>
          Already have an account?{' '}
          <TextLink href="/login">
            <Strong>Sign in</Strong>
          </TextLink>
        </Text>
      </form>
    </>
  )
}
