import { DynamicComponentDefinition } from "./dynamic-component-definition";

export type DynamicComponentInputs<T extends DynamicComponentDefinition<any, any>> =
  T extends DynamicComponentDefinition<infer Class, infer InputNames>
  ? Pick<Class, InputNames>
  : never;
