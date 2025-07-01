'use client';
import { DemoLayout, Item, List } from '@/components/demo-layout';
import { AuthLayout } from '@/components/th/auth-layout';
import { Button } from '@/components/th/button';
import { Checkbox, CheckboxField } from '@/components/th/checkbox';
import { Field, Label } from '@/components/th/fieldset';
import { Heading } from '@/components/th/heading';
import { Input } from '@/components/th/input';
import { Strong, Text, TextLink } from '@/components/th/text';
// import { Logo } from './logo'
export default function AuthLayoutPage(): React.JSX.Element {
  return (
    <DemoLayout>
      <List title="Auth Layout">
        <Item title="Login Form">
          <AuthLayout>
            <form
              action="#"
              method="POST"
              className="grid w-full max-w-sm grid-cols-1 gap-8"
            >
              {/* <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" /> */}
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
                  <TextLink href="#">
                    <Strong>Forgot password?</Strong>
                  </TextLink>
                </Text>
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
              <Text>
                Don’t have an account?{' '}
                <TextLink href="#">
                  <Strong>Sign up</Strong>
                </TextLink>
              </Text>
            </form>
          </AuthLayout>
        </Item>
      </List>
    </DemoLayout>
  );
}
