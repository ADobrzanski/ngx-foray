import { ComponentRef, ElementRef, KeyValueDiffer } from "@angular/core";
import { FormControlDirective } from "@angular/forms";
import { Subscription } from "rxjs";
import { DynamicComponentUnpacked } from "../utils/dynamic-component-utils";
import { SomeComponent } from "./some-component.type";
import { IOPropertyKey } from "./io-property-key.type";

export type ComponentData =
  & DynamicComponentUnpacked
  & {
      componentRef: ComponentRef<SomeComponent>,
      elementRef: ElementRef<unknown>,
      differ: KeyValueDiffer<unknown, unknown>,
      alreadyChangedPropsSet: Set<IOPropertyKey>,
      interfaceDescription: {
        inputs: Set<IOPropertyKey>,
        outputs: Set<IOPropertyKey>,
      }
      subs: {
        all: Subscription,
        outputs: Map<IOPropertyKey, Subscription>,
        ngControl?: Subscription,
      },
      fcd?: FormControlDirective,
    };