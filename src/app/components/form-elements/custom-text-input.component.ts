import { Component, Input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { makeComponentDefinition } from "src/app/dynamic/models/dynamic-component-definition";

@Component({
    selector: 'form-input',
    template: `
        <input pInputText [value]="value || ''" (input)="handleInput($event)" [placeholder]="placeholder || ''" [disabled]="disabled" (blur)="handleBlur($event)" />
    `,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: CustomTextInputComponent, multi: true }],
})
export class CustomTextInputComponent implements ControlValueAccessor {
    @Input() placeholder?: string;

    value: string | undefined;

    disabled = false;

    handleInput(x: Event): void {
        this.value = (x.target as any).value as string;
        this.onChange(this.value);
    }

    handleBlur(x: Event): void {
        this.value = (x.target as any).value as string;
        this.onTouch(this.value);
    }

    onChange: (value: string) => unknown = () => void(0);

    onTouch: (value: string) => unknown = () => void(0);

    writeValue(value: any): void {
        if (typeof value === 'string') { this.value = value; }
    }

    registerOnChange(fn: any): void {
        console.log('registerOnChange');
        if (typeof fn === 'function') { this.onChange = fn; }
    }

    registerOnTouched(fn: any): void {
        if (typeof fn === 'function') { this.onTouch = fn; }
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}

export const textInput = makeComponentDefinition({
    classRef: CustomTextInputComponent,
    inputs: ['placeholder'],
});