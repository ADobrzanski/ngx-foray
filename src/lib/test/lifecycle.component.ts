import { AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, Component, DoCheck, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { makeComponentDefinition } from "../models/dynamic-component-definition";
import { useComponent2 } from "../utils/dynamic-component-utils";

export enum LifecycleHook {
    OnChanges,
    DoCheck,
    OnInit,
    AfterContentChecked,
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    OnDestroy,
}

export type HooksTrace = [methodName: LifecycleHook, args?: any[]][];

@Component({
    selector: 'test-lifecycle',
})
export class LifecycleComponent implements DoCheck, OnChanges, OnInit, AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, OnDestroy {
    hooksTrace: HooksTrace = [];

    @Input() inputProperty: any;

    private notifyHookCalled(hookName: LifecycleHook, args?: any[]) {
        this.hooksTrace.push([hookName, args]);
    }

    ngDoCheck(): void {
        this.notifyHookCalled(LifecycleHook.DoCheck);
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.notifyHookCalled(LifecycleHook.OnChanges, [changes]);
    }

    ngOnInit(): void {
        this.notifyHookCalled(LifecycleHook.OnInit);
    }

    ngAfterContentChecked(): void {
        this.notifyHookCalled(LifecycleHook.AfterContentChecked);
    }

    ngAfterContentInit(): void {
        this.notifyHookCalled(LifecycleHook.AfterContentInit);
    }

    ngAfterViewChecked(): void {
        this.notifyHookCalled(LifecycleHook.AfterViewChecked);
    }

    ngAfterViewInit(): void {
        this.notifyHookCalled(LifecycleHook.AfterViewInit);
    }

    ngOnDestroy(): void {
        this.notifyHookCalled(LifecycleHook.OnDestroy);
    }
}

export const lifecycleComponentDefinition = makeComponentDefinition({
    classRef: LifecycleComponent,
    inputs: ['inputProperty'],
});

export const useLifecycleComponent = useComponent2(lifecycleComponentDefinition);