import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './components/hello.component';
import { FarewellComponent } from './components/farewell.component';
import { CustomTextInputComponent } from './components/form-elements/custom-text-input.component';
import { NgTextInputComponent } from './components/form-elements/ng-text-input.component';
import { ToggleButtonModule } from 'primeng/togglebutton';

import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DynamicComponentsModule } from './dynamic/dynamic.module';
import { DynamicCellTableComponent } from './components/form-elements/dynamic-cell-table.component';

@NgModule({
  imports: [
    // angular
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    // prime
    DropdownModule,
    InputTextModule,
    TableModule,
    ToggleButtonModule,
    // dynamic
    DynamicComponentsModule
  ],
  declarations: [
    AppComponent,
    HelloComponent,
    FarewellComponent,
    CustomTextInputComponent,
    NgTextInputComponent,
    DynamicCellTableComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
