import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  Renderer2,
  Type,
  ViewContainerRef,
} from "@angular/core";
import { map, Subscription } from "rxjs";
import { FormControlDirective } from "@angular/forms";
import { DynamicComponentContainer } from "./models/dynamic-component-container.type";
import { intoSimpleChanges } from "./utils/change-detection.utils";
import { unpackComponentContainer } from "./utils/dynamic-component-utils";
import {
  isControlValueAccessor,
  registerFakeNgControlStatusDirective,
  registerFormControlDirective,
} from "./utils/dynamic-form.utils";

@Directive({ selector: "[ngxDynamicComponent]" })
export class DynamicComponentDirective {
  @Input("ngxDynamicComponent") set componentContainer(componentContainer: DynamicComponentContainer | undefined) {
    this.fakeChangeDetectionSub?.unsubscribe();
    /*@todo only clear when classRef changes */
    this.viewContainerRef.clear();

    if (!componentContainer) { return; }

    this.consumeComponentContainer(componentContainer);
  };

  private fakeChangeDetectionSub?: Subscription;

  private fakeNgControlDirectiveSub?: Subscription;

  private fcd?: FormControlDirective;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly compFactoryResolver: ComponentFactoryResolver,
    private readonly renderer: Renderer2
  ) {}

  private createComponent<T>(classRef: Type<T>): ComponentRef<T> {
    const componentFactory =
      this.compFactoryResolver.resolveComponentFactory(classRef);

    return this.viewContainerRef.createComponent(componentFactory);
  }

  private consumeComponentContainer(
    componentContainer: DynamicComponentContainer
  ) {
    let { classRef, props$, classes } = unpackComponentContainer(componentContainer);

    // @note!! does `createComponent` rise ngOnInit? should I provide inputs earlier
    const componentRef = this.createComponent(classRef);
    const componentInstance = componentRef.instance as Type<unknown>;
    const elementRef = componentRef.injector.get(ElementRef, null);

    this.fakeChangeDetectionSub = props$
      .pipe(
        map((_) => <Record<string, unknown>>_),
        intoSimpleChanges,
      )
      .subscribe((simpleChanges) => {
        Object.entries(simpleChanges).forEach(([key, value]) => {
          /*
          @note moving contidion into a variable
                makes TS forget implications - type guards
          */
          if (!(
            key === "formControl" &&
            isControlValueAccessor(componentInstance)
          )) {
            (<any>componentRef).instance[key] = value.currentValue;
            return;
          }
          
          // @todo check if this.viewContainerRef.clear(); invokes ngOnDestroy
          this.fcd = registerFormControlDirective(componentInstance, value);

          if (!elementRef) { return; }

          this.fakeNgControlDirectiveSub = registerFakeNgControlStatusDirective(elementRef, this.fcd, this.renderer);
        });

        (<any>componentInstance).ngOnChanges?.(simpleChanges);
        componentRef.changeDetectorRef.markForCheck();
        // @important/todo - classes are not added by proxy thus changeable only by rerunning use function
        (elementRef?.nativeElement).classList = classes;
      });
  }
}
