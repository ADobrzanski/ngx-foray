import { NgModule } from '@angular/core';
import { DynamicComponentDirective } from './dynamic.component';

const exports = [DynamicComponentDirective];

@NgModule({
    declarations: [...exports],
    imports: [],
    exports,
})
export class DynamicComponentsModule {}