import { EventEmitter, Type } from "@angular/core";
import { DynamicComponentDefinition } from "./dynamic-component-definition";
import { DynamicComponentInputs } from "./dynamic-component-inputs.type";

type PickByType<T, Value> = {
  [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P]
}

export type ComponentOutputs<ComponentClass extends {}, OutputsOnly = PickByType<ComponentClass, EventEmitter<any>>> =
  {
    [P in keyof OutputsOnly]: ($event: OutputsOnly[P] extends EventEmitter<infer E> ? E : never) => any
  }


export type DynamicComponentContainer = <R>(
  cont: <
    ComponentClass extends {},
    InputKeys extends keyof ComponentClass,
    Props extends {} = Partial<
      & DynamicComponentInputs<DynamicComponentDefinition<ComponentClass, InputKeys>>
      & ComponentOutputs<ComponentClass>
    >
  >(
    classRef: Type<ComponentClass>,
    props: Props | (() => Props) ,
    classes: string[]
  ) => R
) => R;
