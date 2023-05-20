import {
  ComponentFactoryResolver,
  Directive,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
  KeyValueChangeRecord,
  KeyValueChanges,
  KeyValueDifferFactory,
  KeyValueDiffers,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChange,
  SimpleChanges,
  ViewContainerRef,
} from "@angular/core";
import { Subscription } from "rxjs";
import { ControlValueAccessor, FormControl } from "@angular/forms";
import { DynamicComponentContainer } from "./models/dynamic-component-container.type";
import { DynamicComponentUnpacked, unpackComponentContainer } from "./utils/dynamic-component-utils";
import {
  isControlValueAccessor,
  registerFakeNgControlStatusDirective,
  registerFormControlDirective,
} from "./utils/dynamic-form.utils";
import { ComponentData } from "./models/component-data.type";
import { IOPropertyKey } from "./models/io-property-key.type";
import { IOChangeRecord } from "./models/io-change-record.type";



@Directive({ selector: "[ngxDynamicComponent]" })
export class DynamicComponentDirective implements OnChanges, OnDestroy, DoCheck {
  @Input("ngxDynamicComponent") componentContainer?: DynamicComponentContainer;

  private activeComponent?: ComponentData;

  private objectDifferFactory: KeyValueDifferFactory;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly compFactoryResolver: ComponentFactoryResolver,
    private readonly renderer: Renderer2,
    keyValueDiffers: KeyValueDiffers
  ) {
    this.objectDifferFactory = keyValueDiffers.find({});
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.componentContainer) return;

    const newComponent = (changes.componentContainer.currentValue as this['componentContainer'] | undefined)
      && unpackComponentContainer(changes.componentContainer.currentValue);

    const componentChanged = this.activeComponent?.classRef !== newComponent?.classRef;

    if (componentChanged) {
      if (this.activeComponent) {
        this.viewContainerRef.clear();
      }

      if (newComponent) {
        this.activeComponent = this.initializeAndAttach(newComponent);
        this.activeComponent?.componentRef.hostView.onDestroy(() => {
          this.activeComponent?.subs.all.unsubscribe();
          this.activeComponent = undefined;
        })
      }
      
    }
  }

  ngDoCheck(): void {
    if (!this.activeComponent) return;

    this.activeComponent.elementRef.nativeElement = this.activeComponent.classes;
    this.bindPropsAndDirectives(this.activeComponent);
  }

  ngOnDestroy(): void {
    this.viewContainerRef.clear();
  }

  private initializeAndAttach(unpackedComponent: DynamicComponentUnpacked): ComponentData | undefined {
    const componentFactory = this.compFactoryResolver.resolveComponentFactory(unpackedComponent.classRef);
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    const elementRef = componentRef.injector.get(ElementRef, null);
    const differ = this.objectDifferFactory.create();
    const alreadyChangedPropsSet = new Set<IOPropertyKey>();
    const interfaceDescription = {
      inputs: new Set(componentFactory.inputs.map(_ => _.propName)),
      outputs: new Set(componentFactory.outputs.map(_ => _.propName)),
    };
    const subs = {
      all: new Subscription(),
      outputs: new Map<IOPropertyKey, Subscription>([]),
    }

    // @note possibly throw
    if (!elementRef) return undefined;

    return {
      ...unpackedComponent,
      componentRef,
      elementRef,
      differ,
      interfaceDescription,
      alreadyChangedPropsSet,
      subs,
    }
  }


  private bindPropsAndDirectives(
    componentData: ComponentData,
  ) {
    const propsVal: {} = typeof componentData.props === "function"
      ? componentData.props()
      : componentData.props;
    const keyValueChanges = componentData.differ.diff(propsVal);

    keyValueChanges?.forEachItem((change) => {
      const firstChange = componentData.alreadyChangedPropsSet.has(change.key);
      /*
      @note moving contidion into a variable
            makes TS forget implications - type guards
      */
      if (
        change.key === "formControl" &&
        isControlValueAccessor(componentData.componentRef.instance)
      ) {
        this.attachFormControlDirective(
          componentData,
          componentData.componentRef.instance,
          change as IOChangeRecord<FormControl>,
          firstChange
        );
        return;
      }

      this.applyBindingChange(componentData, change);
      componentData.alreadyChangedPropsSet.add(change.key);
    });

    const simpleChanges = keyValueChanges
      ? this.makeSimpleChanges(keyValueChanges, componentData)
      : {};

    componentData.componentRef.instance.ngOnChanges?.(simpleChanges);
    componentData.componentRef.changeDetectorRef.markForCheck();

    keyValueChanges?.forEachItem((change) =>
      componentData.alreadyChangedPropsSet.add(change.key)
    );
  }

  private applyBindingChange(componentData: ComponentData, change: IOChangeRecord) {
    if (componentData.interfaceDescription.inputs.has(change.key)) {
      componentData.componentRef.instance[change.key] = change.currentValue;
    } else {
      componentData.subs.outputs.get(change.key)?.unsubscribe();
      const sub = (componentData.componentRef.instance[change.key] as EventEmitter<unknown>).subscribe(change.currentValue);
      componentData.subs.outputs.set(change.key, sub);
      componentData.subs.all.add(sub);
    }
    return;
  }

  private attachFormControlDirective(
    componentData: ComponentData,
    controlValueAccessor: ControlValueAccessor,
    change: KeyValueChangeRecord<IOPropertyKey, FormControl>,
    firstChange: boolean
  ) {
    componentData.fcd = registerFormControlDirective(
      controlValueAccessor,
      new SimpleChange(
        change.previousValue,
        change.currentValue,
        firstChange
      )
    );

    componentData.subs.ngControl?.unsubscribe();
    componentData.subs.ngControl = registerFakeNgControlStatusDirective(
      componentData.elementRef,
      componentData.fcd,
      this.renderer
    );
    componentData.subs.all.add(componentData.subs.ngControl);
  }

  private makeSimpleChanges(
    keyValueChanges: KeyValueChanges<IOPropertyKey, unknown>,
    componentData: ComponentData,
  ) {
    const simpleChanges: SimpleChanges = {};

    keyValueChanges.forEachItem(
      (change) =>
        componentData.interfaceDescription?.inputs.has(change.key) &&
        (simpleChanges[change.key] = new SimpleChange(
          change.previousValue,
          change.currentValue,
          componentData.alreadyChangedPropsSet.has(change.key)
        ))
    );

    return simpleChanges;
  }
}
