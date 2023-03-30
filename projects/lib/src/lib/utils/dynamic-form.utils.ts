import {
  ControlValueAccessor,
  FormControlDirective,
  NgControl,
  NgControlStatus,
} from "@angular/forms";
import { startWith } from "rxjs";
import { ElementRef, Renderer2, SimpleChange } from "@angular/core";

export function isControlValueAccessor(x: {}): x is ControlValueAccessor {
  return (
    "writeValue" in x && "registerOnChange" in x && "registerOnTouched" in x
  );
}

export const registerFormControlDirective = (
  componentInstance: ControlValueAccessor,
  formControlChanges: SimpleChange
) => {
  const fcd = new FormControlDirective([], [], [componentInstance], null);

  fcd.form = formControlChanges.currentValue;
  fcd.ngOnChanges({ form: formControlChanges });

  return fcd;
}

export const registerFakeNgControlStatusDirective = (
  element: ElementRef,
  control: NgControl,
  renderer: Renderer2
) => {
  const ngcs = new NgControlStatus(control);

  const toggleNgStatusClass = (...args: Parameters<NgControlStatus["is"]>) => {
    const [status] = args;

    const className = `ng-${status}`;
    if (ngcs.is(status)) renderer?.addClass(element, className);
    else renderer?.removeClass(element, className);
  };

  const updateSubscription = control.statusChanges
    ?.pipe(startWith(null))
    .subscribe(() => {
      toggleNgStatusClass("untouched");
      toggleNgStatusClass("touched");
      toggleNgStatusClass("pristine");
      toggleNgStatusClass("dirty");
      toggleNgStatusClass("valid");
      toggleNgStatusClass("invalid");
      toggleNgStatusClass("pending");
    });

  return updateSubscription;
};
