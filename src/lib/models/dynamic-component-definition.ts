import { Type } from "@angular/core";
export type ComponentLike = Record<string | number | symbol, unknown>;

export type DynamicComponentDefinition<
  ComponentClass extends {},
  InputKeys extends keyof ComponentClass
> = {
  classRef: Type<ComponentClass>;
  inputs: readonly InputKeys[];
};

export function makeComponentDefinition<
  ComponentClass extends {},
  InputKeys extends keyof ComponentClass
>(definition: {
  classRef: Type<ComponentClass>;
  inputs: readonly InputKeys[];
}): { classRef: Type<ComponentClass>; inputs: readonly InputKeys[] } {
  return definition;
}
