import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { makeComponentDefinition } from "src/app/dynamic/models/dynamic-component-definition";

@Component({
    selector: 'form-lazy-man-input',
    providers: [FormsModule, ReactiveFormsModule, CommonModule],
    template: `
        <input pInputText [formControl]="control" [placeholder]="placeholder || ''" />
    `
})
export class NgTextInputComponent {
    @Input() control: FormControl = new FormControl();
    @Input() placeholder?: string;
}

export const ngTextInput = makeComponentDefinition({
    classRef: NgTextInputComponent,
    inputs: ['control', 'placeholder'],
});