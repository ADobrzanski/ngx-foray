import {
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  DoCheck,
  ElementRef,
  Input,
  KeyValueChanges,
  KeyValueDiffer,
  KeyValueDifferFactory,
  KeyValueDiffers,
  OnDestroy,
  Renderer2,
  SimpleChange,
  SimpleChanges,
  Type,
  ViewContainerRef,
} from "@angular/core";
import { Subscription } from "rxjs";
import { FormControlDirective } from "@angular/forms";
import { DynamicComponentContainer } from "./models/dynamic-component-container.type";
import { unpackComponentContainer } from "./utils/dynamic-component-utils";
import {
  isControlValueAccessor,
  registerFakeNgControlStatusDirective,
  registerFormControlDirective,
} from "./utils/dynamic-form.utils";

@Directive({ selector: "[ngxDynamicComponent]" })
export class DynamicComponentDirective implements OnDestroy, DoCheck {

  @Input("ngxDynamicComponent") componentContainer: DynamicComponentContainer | undefined = undefined;;

  private lastComponentClassRef: Type<unknown> | undefined = undefined;

  private fakeNgControlDirectiveSub?: Subscription;

  private fcd?: FormControlDirective;

  private objectDifferFactory: KeyValueDifferFactory;

  private alreadyChangedPropsSet = new Set<string>();

  private differ: KeyValueDiffer<unknown, unknown>;

  private componentFactory: ComponentFactory<unknown> | undefined = undefined;
  private componentRef: ComponentRef<unknown> | undefined = undefined;
  private elementRef: ElementRef<unknown> | null = null;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly compFactoryResolver: ComponentFactoryResolver,
    private readonly renderer: Renderer2,
    keyValueDiffers: KeyValueDiffers
  ) {
    this.objectDifferFactory = keyValueDiffers.find({});
    this.differ = keyValueDiffers.find({}).create();
  }

  ngDoCheck(): void {
    const dynamicComponent = this.componentContainer && unpackComponentContainer(this.componentContainer);

    if (dynamicComponent?.classRef !== this.lastComponentClassRef) {
      this.lastComponentClassRef = dynamicComponent?.classRef;
      this.viewContainerRef.clear();

      if (!dynamicComponent) return;

      this.componentFactory = this.compFactoryResolver.resolveComponentFactory(
        dynamicComponent.classRef
      );
      this.componentRef = this.viewContainerRef.createComponent(this.componentFactory);
      this.elementRef = this.componentRef.injector.get(ElementRef, null);

      this.differ = this.objectDifferFactory.create();
      this.alreadyChangedPropsSet.clear();
    }

    if (!dynamicComponent) return;

    this.elementRef && this.applyClasses(this.elementRef, dynamicComponent.classes);
    this.componentRef && this.bindInputsAndDirectives(dynamicComponent.props, this.componentRef);
  }

  ngOnDestroy(): void {
    throw new Error("Method not implemented.");
  }

  private applyClasses(elementRef: ElementRef, classList: string[]) {
    (elementRef?.nativeElement).classList = classList;
  }

  private bindInputsAndDirectives(
    inputs: () => {},
    componentRef: ComponentRef<unknown>
  ) {
    const componentInstance = componentRef.instance as Type<unknown>;
    const elementRef = componentRef.injector.get(ElementRef, null);

    const keyValueChanges = this.differ.diff(inputs());

    keyValueChanges?.forEachItem((change) => {
      /*
      @note moving contidion into a variable
            makes TS forget implications - type guards
      */
      if (
        !(
          change.key === "formControl" &&
          isControlValueAccessor(componentInstance)
        )
      ) {
        (<any>componentRef).instance[change.key] = change.currentValue;
        return;
      }

      // @todo check if this.viewContainerRef.clear(); invokes ngOnDestroy
      this.fcd = registerFormControlDirective(
        componentInstance,
        new SimpleChange(
          change.previousValue,
          change.currentValue,
          this.alreadyChangedPropsSet.has(change.key)
        )
      );

      if (!elementRef) {
        return;
      }

      this.fakeNgControlDirectiveSub?.unsubscribe();
      this.fakeNgControlDirectiveSub = registerFakeNgControlStatusDirective(
        elementRef,
        this.fcd,
        this.renderer
      );
    });

    const simpleChanges = keyValueChanges
      ? this.makeSimpleChanges(keyValueChanges, this.alreadyChangedPropsSet)
      : {};

    (<any>componentInstance).ngOnChanges?.(simpleChanges);
    componentRef.changeDetectorRef.markForCheck();

    keyValueChanges?.forEachItem((change) =>
      this.alreadyChangedPropsSet.add(change.key)
    );
  }

  private makeSimpleChanges(
    keyValueChanges: KeyValueChanges<string, unknown>,
    alreadyChangedPropsSet: Set<string>
  ) {
    const simpleChanges: SimpleChanges = {};

    keyValueChanges.forEachChangedItem(
      (change) =>
        (simpleChanges[change.key] = new SimpleChange(
          change.previousValue,
          change.currentValue,
          alreadyChangedPropsSet.has(change.key)
        ))
    );

    return simpleChanges;
  }
}
