import { Type } from "@angular/core";
import { DynamicComponentDefinition } from "./dynamic-component-definition";
import { DynamicComponentInputs } from "./dynamic-component-inputs.type";

export type DynamicComponentContainer = <R>(
  cont: <
    ComponentClass extends {},
    InputKeys extends keyof ComponentClass,
    Props extends {} = Partial<DynamicComponentInputs<DynamicComponentDefinition<ComponentClass, InputKeys>>
    >
  >(
    classRef: Type<ComponentClass>,
    props: Props | (() => Props) ,
    classes: string[]
  ) => R
) => R;
