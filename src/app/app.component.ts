import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from "@angular/core";
import { useComponent2, useComponent } from "./dynamic/utils/dynamic-component-utils";
import { farewellComponentDefinition } from "./components/farewell.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ngTextInput } from "./components/form-elements/ng-text-input.component";
import { DynamicComponentContainer } from "./dynamic/models/dynamic-component-container.type";

interface Row {
  name: string;
  surname: string;
  age: number;
}

interface Column {
  header: string;
  field?: string;
  cell?: (row: Row) => DynamicComponentContainer;
}

const useFarewell = useComponent2(farewellComponentDefinition);
const useInput = useComponent2(ngTextInput);

@Component({
  selector: "my-app",
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
      }
    `,
  ],
  template: `
    <ng-container
      *ngFor="let component of componentInOrder"
      [ngxDynamicComponent]="component.container"
    >
    </ng-container>

    <app-dynamic-cell-table [columns]="columns" [value]="rows">
    </app-dynamic-cell-table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  columns: Column[] = [
    { header: "Name", field: "name" },
    { header: "Surname", field: "surname" },
    {
      header: "Farewell",
      cell: (row) =>
        useFarewell({ nickname: `${row.name} ${row.surname}` }).container,
    },
  ];

  rows: Row[] = [
    { name: "Boris", surname: "Moe", age: 15 },
    { name: "Cree", surname: "Klement", age: 20 },
  ];

  private formGroupControls = {
    name: new FormControl("John", [
      Validators.required,
      Validators.maxLength(10),
    ]),
    surname: new FormControl("Smith"),
  };

  form = new FormGroup(this.formGroupControls);

  components = this.createComponents();

  componentInOrder = [
    this.components.farewell,
    this.components.name,
    this.components.surname,
  ];

  get isValid(): boolean {
    return this.form.valid;
  }

  constructor(private readonly cdr: ChangeDetectorRef) {
    const { farewell } = this.components;

    farewell.state.nickname =
      this.form.value.name + " " + this.form.value.surname;
    this.form.valueChanges.subscribe((_) => {
      farewell.state.nickname = (_.name + " " + _.surname).trim();
    });

    setTimeout(() => {
      this.rows = [
        ...this.rows,
        { name: "August", surname: "Alberto", age: 39.5 },
      ];
      this.cdr.markForCheck();
    }, 1000);
  }

  private createComponents() {
    const { name, surname } = this.formGroupControls;

    return {
      name: useInput({ control: name, placeholder: "Name" }),
      surname: useComponent(ngTextInput, {
        control: surname,
        placeholder: "Surname",
      }),
      farewell: useComponent(farewellComponentDefinition, { nickname: "" }),
    };
  }
}
