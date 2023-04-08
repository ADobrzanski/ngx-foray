import { DynamicComponentDefinition } from "../models/dynamic-component-definition";
import { ControlValueAccessor, FormControl } from "@angular/forms";
import { Type } from "@angular/core";
import { ComponentOutputs, DynamicComponentContainer } from "../models/dynamic-component-container.type";
import { SomeComponent } from "../models/some-component.model";
import { SomeComponentProps } from "../models/some-component-props.model";

type MaybeFormControl<
  ComponentClass extends {},
  InputKeys extends keyof ComponentClass
> = ComponentClass extends ControlValueAccessor
  ? InputKeys extends "formControl"
    ? unknown
    : { formControl: FormControl }
  : unknown;

export function useComponent<
  ComponentClass extends {},
  InputKeys extends keyof ComponentClass,
  Props extends {} = Partial<MaybeFormControl<ComponentClass, InputKeys> & Pick<ComponentClass, InputKeys>>,
>(
  compDefinition: DynamicComponentDefinition<ComponentClass, InputKeys>,
  inputs: Props | (() => Props),
  classList?: string[]
): {
  container: DynamicComponentContainer;
} {
  const container = <R>(
    cont: (
      cR: Type<ComponentClass>,
      p: Props | (() => Props),
      clsList: string[]
    ) => R
  ) => cont(compDefinition.classRef, inputs, classList || []);

  return { container };
}

/* @note
could we skip DynamicComponentDefinition?
maybe we could makeComponentFunction(classRef) => (inputs) => container
*/
export function useComponent2<
  ComponentClass extends {},
  InputKeys extends keyof ComponentClass,
  Props extends {} = Partial<
    & MaybeFormControl<ComponentClass, InputKeys>
    & Pick<ComponentClass, InputKeys>
    & ComponentOutputs<ComponentClass>
  >,
>(compDefinition: DynamicComponentDefinition<ComponentClass, InputKeys>) {
  return (
    inputs: Props | (() => Props),
    classList?: string[],
  ) => useComponent(compDefinition, inputs, classList);
}

// @future-note In Angular 15 default to UntypedFormControl. Accept generic type for FormControl to use.
export function useControl<
  ComponentClass extends ControlValueAccessor & { formControl?: never },
  InputKeys extends keyof ComponentClass,
  Props = Partial<
    & Pick<ComponentClass, InputKeys> & { formControl: FormControl }
    & ComponentOutputs<ComponentClass>
  >
>(
  compDefinition: DynamicComponentDefinition<ComponentClass, InputKeys>,
  // inputs: () => Partial<Pick<ComponentClass, InputKeys> & { formControl: FormControl }> | Partial<Pick<ComponentClass, InputKeys> & { formControl: FormControl }>,,
  inputs: Props | (() => Props),
  formControlConfig: ConstructorParameters<typeof FormControl> = []
): {
  container: DynamicComponentContainer;
  control: FormControl;
} {
  const control = new FormControl(...(formControlConfig || []));

  const newInputsFn =
    typeof inputs === "function"
      ? () => ({ ...(<() => Props>inputs)(), formControl: control as any })
      : { ...inputs, formControl: control as any };

  return { ...useComponent(compDefinition, newInputsFn), control };
}

export function unpackComponentContainer(
  componentContainer: DynamicComponentContainer
) {
  // 'undefined as any' silences 'Variable xyz is unassigned before it is used' on return;
  // 'componentContainer' callback executes synchronously initializing variables before return
  // This TypeScript cannot know thus the fake initialization.
  let classRef: Type<SomeComponent> = undefined as any;
  let props: SomeComponentProps | (() => SomeComponentProps) = undefined as any;
  let classes: string[] = undefined as any;

  componentContainer((cR, p, clss) => {
    classRef = cR;
    props = p;
    classes = clss;
  });

  return { classRef, props, classes };
}

export const evaluateMaybeFactory = <T>(maybeFactory: T | (() => T)): T => {
  return (typeof maybeFactory === 'function')
    ? (<any>maybeFactory)()
    : maybeFactory;
}