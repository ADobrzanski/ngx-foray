import { Component, EventEmitter, HostListener, Input, Output } from "@angular/core";
import { useComponent2 } from "../utils/dynamic-component-utils";
import { makeComponentDefinition } from "../models/dynamic-component-definition";

@Component({
    selector: "test-simple",
    template: `{{ simpleInput }}`
})
export class TestSimpleComponent {
    static eventValue = 'eventValue' as const;
    @Input() simpleInput?: string;
    @Output() simpleOutput = new EventEmitter<typeof TestSimpleComponent.eventValue>();
    @HostListener('click')
    handleClick() { this.simpleOutput.emit(TestSimpleComponent.eventValue); }
}

export const testSimpleComponentDefinition = makeComponentDefinition({
    classRef: TestSimpleComponent,
    inputs: ['simpleInput'],
})
export const useTestSimpleComponent = useComponent2(testSimpleComponentDefinition);