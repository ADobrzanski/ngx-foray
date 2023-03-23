import { ReplaySubject } from "rxjs";
import { DynamicComponentDefinition } from "../models/dynamic-component-definition";
import { ControlValueAccessor, FormControl } from "@angular/forms";
import { Type } from "@angular/core";
import { DynamicComponentContainer } from "../models/dynamic-component-container.type";

type MaybeFormControl<
  ComponentClass extends {},
  InputKeys extends keyof ComponentClass
> = ComponentClass extends ControlValueAccessor
  ? InputKeys extends "formControl"
    ? unknown
    : { formControl: FormControl }
  : unknown;

function makeInputProxy<
  ComponentClass extends {},
  InputKeys extends keyof ComponentClass,
  Inputs = MaybeFormControl<ComponentClass, InputKeys> &
    Pick<ComponentClass, InputKeys>
>(
  definition: DynamicComponentDefinition<ComponentClass, InputKeys>,
  initInputValues?: Partial<Inputs>
) {
  // @todo improve typing, drop `as` assignment
  const emptyInputsObject = Object.fromEntries(
    definition.inputs.map((inputName) => [inputName, undefined])
  ) as Partial<Inputs>;

  const inputsObject = { ...emptyInputsObject, ...initInputValues };
  const inputsSubject$ = new ReplaySubject<Partial<Inputs>>();

  const proxy = new Proxy(inputsObject, {
    set(target, p, value) {
      (<any>target)[p] = value;
      inputsSubject$.next({ ...target });
      return true;
    },
  });

  const inputs$ = inputsSubject$.asObservable();
  initInputValues && inputsSubject$.next(inputsObject);

  return [proxy, inputs$] as const;
}

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
  Props extends {} = Partial<MaybeFormControl<ComponentClass, InputKeys> & Pick<ComponentClass, InputKeys>>,
>(compDefinition: DynamicComponentDefinition<ComponentClass, InputKeys>) {
  return (
    inputs: Props | (() => Props),
    classList?: string[]
  ) => useComponent(compDefinition, inputs, classList);
}

// @future-note In Angular 15 default to UntypedFormControl. Accept generic type for FormControl to use.
export function useControl<
  ComponentClass extends ControlValueAccessor & { formControl?: never },
  InputKeys extends keyof ComponentClass,
  Props = Partial<
    Pick<ComponentClass, InputKeys> & { formControl: FormControl }
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
  let classRef: Type<unknown> = undefined as any;
  let props: object | (() => object) = undefined as any;
  let classes: string[] = undefined as any;

  componentContainer((cR, p, clss) => {
    classRef = cR;
    props = p;
    classes = clss;
  });

  return { classRef, props, classes };
}
