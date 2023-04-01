import { Component, Input } from '@angular/core';
import { makeComponentDefinition } from 'ngx-foray';

@Component({
  selector: 'hello',
  template: `<h1>Hello {{name}}!</h1>`,
  styles: [`h1 { font-family: Lato; }`],
})
export class HelloComponent {
  @Input() name?: string;
}

export const helloComponentDefinition = makeComponentDefinition({
  classRef: HelloComponent,
  inputs: ['name'],
});