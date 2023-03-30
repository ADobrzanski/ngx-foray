import { Component, Input } from '@angular/core';
import { makeComponentDefinition } from 'ngx-foray';

@Component({
  selector: 'farewell',
  template: `<h1>Farewell {{nickname}}!</h1>`,
  styles: [`h1 { font-family: Lato; }`],
})
export class FarewellComponent {
  //@todo check lib behavior when input aliased
  @Input() nickname?: string;
}

export const farewellComponentDefinition = makeComponentDefinition({
  classRef: FarewellComponent,
  inputs: ['nickname'],
});