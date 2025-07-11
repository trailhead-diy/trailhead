'use client';

import { AuthLayout } from '../../th/auth-layout';
import { Button } from '../../th/button';
import { Checkbox, CheckboxField } from '../../th/checkbox';
import { Field, Label } from '../../th/fieldset';
import { Heading } from '../../th/heading';
import { Input } from '../../th/input';
import { Strong, Text, TextLink } from '../../th/text';
import { List, Item } from '../demo-ui';

export function AuthLayoutExamples() {
  return (
    <List title="Auth Layout">
      <Item title="Login Form">
        <SimpleAuthLayout />
      </Item>
    </List>
  );
}

export const SimpleAuthLayout = () => (
  <AuthLayout>
    <form action="#" method="POST" className="grid w-full max-w-sm grid-cols-1 gap-8">
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
        Don't have an account?{' '}
        <TextLink href="#">
          <Strong>Sign up</Strong>
        </TextLink>
      </Text>
    </form>
  </AuthLayout>
);
