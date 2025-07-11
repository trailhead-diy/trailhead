export interface CLIContext {
  readonly version: string;
  readonly projectRoot: string;
  readonly isTrailheadProject: boolean;
}
