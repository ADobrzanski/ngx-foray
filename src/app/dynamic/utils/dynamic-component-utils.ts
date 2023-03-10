import { ReplaySubject, Observable } from "rxjs";
import { DynamicComponentDefinition } from "../models/dynamic-component-definition";
import {
  ControlValueAccessor,
  FormControl,
} from "@angular/forms";
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
>(
  compDefinition: DynamicComponentDefinition<ComponentClass, InputKeys>,
  initInputValues?: Partial<MaybeFormControl<ComponentClass, InputKeys> & Pick<ComponentClass, InputKeys>>
): {
  container: DynamicComponentContainer;
  state: Partial<Pick<ComponentClass, InputKeys> & MaybeFormControl<ComponentClass, InputKeys>>;
} {
  const [inputProxy, inputs$] = makeInputProxy(compDefinition, initInputValues);

  const container = <R>(
    cont: (
      cR: Type<ComponentClass>,
      p: Observable<Partial<Pick<ComponentClass, InputKeys> & MaybeFormControl<ComponentClass, InputKeys>>>
    ) => R
  ) => cont(compDefinition.classRef, inputs$);

  return { container, state: inputProxy };
}

// @future-note In Angular 15 default to UntypedFormControl. Accept generic type for FormControl to use.
export function useControl<
  ComponentClass extends ControlValueAccessor & { formControl?: never },
  InputKeys extends keyof ComponentClass
>(
  compDefinition: DynamicComponentDefinition<ComponentClass, InputKeys>,
  initInputValues: Partial<Pick<ComponentClass, InputKeys> & { formControl: FormControl }> = {},
  formControlConfig: ConstructorParameters<typeof FormControl> = []
): {
  container: DynamicComponentContainer;
  state: Partial<Pick<ComponentClass, InputKeys> & MaybeFormControl<ComponentClass, InputKeys>>;
  control: FormControl;
} {
  const control = new FormControl(...(formControlConfig || []));
  initInputValues.formControl = control as any; // @todo fn input is type save but this could work too :)
  return { ...useComponent(compDefinition, initInputValues), control };
}

export function unpackComponentContainer(
  componentContainer: DynamicComponentContainer
) {
  // 'undefined as any' silences 'Variable xyz is unassigned before it is used' on return;
  // 'componentContainer' callback executes synchronously initializing variables before return
  // This TypeScript cannot know thus the fake initialization.
  let classRef: Type<unknown> = undefined as any;
  let props$: Observable<object> = undefined as any;

  componentContainer((cR, p$) => {
    classRef = cR;
    props$ = p$;
  });

  return { classRef, props$ };
}
