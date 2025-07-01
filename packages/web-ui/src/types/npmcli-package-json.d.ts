declare module '@npmcli/package-json' {
  export default class PackageJson {
    static load(path: string): Promise<PackageJson>
    content: Record<string, unknown>
    update(data: Record<string, unknown>): void
    save(): Promise<void>
  }
}
