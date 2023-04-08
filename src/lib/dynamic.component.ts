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
import { evaluateMaybeFactory, unpackComponentContainer } from "./utils/dynamic-component-utils";
import {
  isControlValueAccessor,
  registerFakeNgControlStatusDirective,
  registerFormControlDirective,
} from "./utils/dynamic-form.utils";
import { SomeComponent } from "./models/some-component.model";
import { SomeComponentProps } from "./models/some-component-props.model";

@Directive({ selector: "[ngxDynamicComponent]" })
export class DynamicComponentDirective implements OnDestroy, DoCheck {
  @Input("ngxDynamicComponent") componentContainer:
    | DynamicComponentContainer
    | undefined = undefined;

  /* component container unpacked */
  private currentComponentClassRef: Type<SomeComponent> | undefined;
  private previousComponentClassRef: Type<SomeComponent> | undefined;
  private props: SomeComponentProps | (() => SomeComponentProps) | undefined;
  private classes: string[] | undefined;
  /* ---------------- */

  private fakeNgControlDirectiveSub?: Subscription;

  private fcd?: FormControlDirective;

  /* change detection utils */
  private objectDifferFactory: KeyValueDifferFactory;
  private differ: KeyValueDiffer<unknown, unknown>;
  private propsAlreadyChangedOnce = new Set<string>();
  private componentInterface: { inputs: Set<string>, outputs: Set<string> } | undefined;
  /* ---------------- */

  /* component manipulation utils */
  private componentRef: ComponentRef<SomeComponent> | undefined;
  private elementRef: ElementRef<SomeComponent> | null = null;
  /* ---------------- */

  private allComponentSubs = new Subscription();
  private outputSubs = new Map<any, Subscription>();

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly compFactoryResolver: ComponentFactoryResolver,
    private readonly renderer: Renderer2,
    keyValueDiffers: KeyValueDiffers
  ) {
    this.objectDifferFactory = keyValueDiffers.find({});
    this.differ = keyValueDiffers.find({}).create();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.componentContainer) return;
    this.unpackAndStoreContainerPayload(changes.componentContainer.currentValue);

    if (this.currentComponentClassRef !== this.previousComponentClassRef) {
      this.handleComponentClassRefChanged(
        this.currentComponentClassRef,
        this.previousComponentClassRef,
      );
    }
  }

  private handleComponentClassRefChanged(
    newComponentClassRef: Type<SomeComponent> | undefined,
    previousComponentClassRef: Type<SomeComponent> | undefined,
  ) {
    if (previousComponentClassRef) {
      this.cleanupPrevComponent();
    }

    if (newComponentClassRef) {
      this.initComponentAndComponentData(newComponentClassRef);
    }
  }

  private unpackAndStoreContainerPayload(componentContainer: DynamicComponentContainer | undefined) {
    const containerPayload = componentContainer &&
      unpackComponentContainer(componentContainer);

    this.previousComponentClassRef = this.currentComponentClassRef;
    this.currentComponentClassRef = containerPayload?.classRef;

    this.props = containerPayload?.props;
    this.classes = containerPayload?.classes;
  }

  ngDoCheck(): void {
    // @todo merge CSS classes binding into props object
    if (this.elementRef) {
      this.applyCSSClasses(this.elementRef, this.classes || []);
    }

    if (this.props && this.componentRef) {
      this.evaluateAndBindPropsAndDirectives(this.props, this.componentRef);
    }
  }

  ngOnDestroy(): void {
    this.cleanupPrevComponent();
  }

  private initComponentAndComponentData(incomingClassRef: Type<SomeComponent>) {
    const componentFactory =
      this.compFactoryResolver.resolveComponentFactory(incomingClassRef);
    this.componentRef = this.viewContainerRef.createComponent(
      componentFactory
    );
    this.elementRef = this.componentRef.injector.get(ElementRef, null);

    this.differ = this.objectDifferFactory.create();
    this.componentInterface = {
      inputs: new Set(componentFactory.inputs.map(_ => _.propName)),
      outputs: new Set(componentFactory.outputs.map(_ => _.propName)),
    };
  }

  private applyCSSClasses(elementRef: ElementRef, classList: string[]) {
    (elementRef?.nativeElement).classList = classList;
  }

  private cleanupPrevComponent(): void {
    this.componentInterface = undefined;
    this.propsAlreadyChangedOnce.clear();

    this.allComponentSubs.unsubscribe();

    this.fcd?.ngOnDestroy();
    this.fcd = undefined;

    this.fakeNgControlDirectiveSub?.unsubscribe();

    this.elementRef = null;
    this.componentRef = undefined;

    this.viewContainerRef.clear();
  }

  private evaluateAndBindPropsAndDirectives(
    props: SomeComponentProps | (() => SomeComponentProps),
    componentRef: ComponentRef<SomeComponent>
  ) {
    const componentInstance = componentRef.instance;
    // const elementRef = componentRef.injector.get(ElementRef, null);

    const propsVal = evaluateMaybeFactory(props);
    const keyValueChanges = this.differ.diff(propsVal);



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
        if (this.componentInterface?.inputs.has(change.key)) {
          componentInstance[change.key] = change.currentValue;
        } else {
          this.outputSubs.get(change.key)?.unsubscribe();
          const sub = (<any>componentInstance[change.key]).subscribe(change.currentValue);
          this.outputSubs.set(change.key, sub);

          this.allComponentSubs.add(sub);
        }
        return;
      }

      this.fcd = registerFormControlDirective(
        componentInstance,
        new SimpleChange(
          change.previousValue,
          change.currentValue,
          this.propsAlreadyChangedOnce.has(change.key)
        )
      );

      if (!this.elementRef) {
        return;
      }

      this.fakeNgControlDirectiveSub?.unsubscribe();
      this.fakeNgControlDirectiveSub = registerFakeNgControlStatusDirective(
        this.elementRef,
        this.fcd,
        this.renderer
      );
    });

    const simpleChanges = keyValueChanges
      ? this.makeSimpleChanges(keyValueChanges, this.propsAlreadyChangedOnce)
      : {};

    (<any>componentInstance).ngOnChanges?.(simpleChanges);
    componentRef.changeDetectorRef.markForCheck();

    keyValueChanges?.forEachItem((change) =>
      this.propsAlreadyChangedOnce.add(change.key)
    );
  }

  private makeSimpleChanges(
    keyValueChanges: KeyValueChanges<string, unknown>,
    alreadyChangedPropsSet: Set<string>
  ) {
    const simpleChanges: SimpleChanges = {};

    keyValueChanges.forEachChangedItem(
      (change) =>
        this.componentInterface?.inputs.has(change.key) &&
        (simpleChanges[change.key] = new SimpleChange(
          change.previousValue,
          change.currentValue,
          alreadyChangedPropsSet.has(change.key)
        ))
    );

    return simpleChanges;
  }
}
