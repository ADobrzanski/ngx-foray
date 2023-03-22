import { Type } from "@angular/core";
import { DynamicComponentDefinition } from "./dynamic-component-definition";
import { DynamicComponentInputs } from "./dynamic-component-inputs.type";

export type DynamicComponentContainer = <R>(
  cont: <ComponentClass extends {}, InputKeys extends keyof ComponentClass>(
    classRef: Type<ComponentClass>,
    props: () => Partial<DynamicComponentInputs<DynamicComponentDefinition<ComponentClass, InputKeys>>>,
    classes: string[]
  ) => R
) => R;