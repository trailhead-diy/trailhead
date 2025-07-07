export interface InstallOptions {
  readonly destinationDir?: string;
  readonly catalystDir?: string;
  readonly framework?: 'redwood-sdk' | 'nextjs' | 'vite' | 'generic-react';
  readonly force?: boolean;
  readonly dryRun?: boolean;
  readonly noConfig?: boolean;
  readonly overwrite?: boolean;
  readonly verbose?: boolean;
  readonly interactive?: boolean;
  readonly wrappers?: boolean;
}

export interface InitOptions {
  readonly name?: string;
  readonly template?: string;
  readonly interactive?: boolean;
}

export interface AddComponentOptions {
  readonly components: readonly string[];
  readonly force?: boolean;
  readonly verbose?: boolean;
}

export interface CLIContext {
  readonly version: string;
  readonly projectRoot: string;
  readonly isTrailheadProject: boolean;
  readonly config?: {
    readonly loaded: boolean;
    readonly filepath: string | null;
    readonly data: import('../config.js').TrailheadConfig;
  };
}

export interface PromptChoice<T = string> {
  readonly name: string;
  readonly value: T;
  readonly description?: string;
  readonly disabled?: boolean | string;
}

export interface FrameworkChoice {
  readonly name: string;
  readonly value: 'redwood-sdk' | 'nextjs' | 'vite' | 'generic-react';
  readonly description: string;
  readonly detected?: boolean;
}
