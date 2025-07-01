export {
  input as prompt,
  select,
  confirm,
  checkbox as multiselect,
  password,
  editor,
  expand,
  rawlist,
  search,
} from '@inquirer/prompts'

export type PromptChoice<T = string> = {
  name?: string
  value: T
  short?: string
  disabled?: boolean | string
}

export type PromptOptions = {
  message: string
  default?: any
  validate?: (input: any) => boolean | string | Promise<boolean | string>
  filter?: (input: any) => any
  transformer?: (input: any, answers: any, flags: any) => any
  when?: boolean | ((answers: any) => boolean | Promise<boolean>)
}
