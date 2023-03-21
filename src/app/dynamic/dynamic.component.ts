import {
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
  Type,
  ViewContainerRef,
} from "@angular/core";
import { map, Observable, Subscription } from "rxjs";
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
export class DynamicComponentDirective implements OnDestroy {
  private applyClasses(elementRef: ElementRef, classList: string[]) {
    (elementRef?.nativeElement).classList = classList;
  }

  @Input("ngxDynamicComponent") set componentContainer(value: DynamicComponentContainer | undefined) {
    this.fakeChangeDetectionSub?.unsubscribe();

    const dynamicComponent = value && unpackComponentContainer(value);

    let componentFactory: ComponentFactory<unknown> | undefined = undefined;
    let componentRef: ComponentRef<unknown> | undefined = undefined; 
    let elementRef: ElementRef<unknown> | null = null;

    if (dynamicComponent?.classRef !== this.lastComponentClassRef) {
      this.viewContainerRef.clear();

      if (!dynamicComponent) return;

      componentFactory = this.compFactoryResolver.resolveComponentFactory(dynamicComponent.classRef);
      componentRef = this.viewContainerRef.createComponent(componentFactory);
      elementRef = componentRef.injector.get(ElementRef, null);
    }

    if (!dynamicComponent) return;

    elementRef && this.applyClasses(elementRef, dynamicComponent.classes);
    componentRef && this.bindInputsAndDirectives(dynamicComponent.props$, componentRef);
  };

  private lastComponentClassRef: Type<unknown> | undefined = undefined;

  private fakeChangeDetectionSub?: Subscription;

  private fakeNgControlDirectiveSub?: Subscription;

  private fcd?: FormControlDirective;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly compFactoryResolver: ComponentFactoryResolver,
    private readonly renderer: Renderer2
  ) {}

  ngOnDestroy(): void {
    throw new Error("Method not implemented.");
  }

  private bindInputsAndDirectives(props$: Observable<{}>, componentRef: ComponentRef<unknown>) {
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

          this.fakeNgControlDirectiveSub?.unsubscribe();
          this.fakeNgControlDirectiveSub = registerFakeNgControlStatusDirective(elementRef, this.fcd, this.renderer);
        });

        (<any>componentInstance).ngOnChanges?.(simpleChanges);
        componentRef.changeDetectorRef.markForCheck();
      });
  }
}
