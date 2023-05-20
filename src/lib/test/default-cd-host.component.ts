import { Component, Input } from "@angular/core";
import { DynamicComponentContainer } from "../models/dynamic-component-container.type";

@Component({
    selector: 'test-default-cd-host',
    template: `
        <ng-container [ngxDynamicComponent]="dynamic"></ng-container>
    `
})
export class DefaultCDHostComponent {
    @Input() dynamic?: DynamicComponentContainer;
}