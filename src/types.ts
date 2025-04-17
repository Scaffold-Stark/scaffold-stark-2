export type Args = string[];

export type RawOptions = {
  project: string | null;
  directory: string | null;
  install: boolean | null;
  dev: boolean;
};

type NonNullableRawOptions = {
  [Prop in keyof RawOptions]: NonNullable<RawOptions[Prop]>;
};

export type Options = NonNullableRawOptions;

export const isDefined = <T>(item: T | undefined | null): item is T =>
  item !== undefined && item !== null;

export type TemplateDescriptor = {
  path: string;
  fileUrl: string;
  relativePath: string;
  source: string;
};
