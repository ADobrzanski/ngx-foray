import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from "@angular/core";
import {
  useComponent2,
  useComponent,
} from "./dynamic/utils/dynamic-component-utils";
import { farewellComponentDefinition } from "./components/farewell.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ngTextInput } from "./components/form-elements/ng-text-input.component";
import { DynamicComponentContainer } from "./dynamic/models/dynamic-component-container.type";
import { startWith } from "rxjs";
import { helloComponentDefinition } from "./components/hello.component";

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
        gap: 12px;
      }

      .grid {
        grid-template-areas:
          "farewell farewell" auto
          "name surname" auto / auto auto;
      }
    `,
  ],
  template: `
    <div class="grid">
      <ng-container
        *ngFor="let component of components | keyvalue; trackBy: trackByIndex" 
        [ngxDynamicComponent]="component.value.container"
      >
      </ng-container>
      <p-toggleButton
        [(ngModel)]="showhello"
        (ngModelChange)="components = createComponents($event)"
        onLabel="Hello"
        offLabel="Goodbye"
      ></p-toggleButton>
    </div>

    <app-dynamic-cell-table [columns]="columns" [value]="rows">
    </app-dynamic-cell-table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  trackByIndex = (idx: number) => idx;

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

  showhello = false;

  components = this.createComponents(this.showhello);

  private nickname = "";

  private formGroupControls = {
    name: new FormControl("John", [
      Validators.required,
      Validators.maxLength(10),
    ]),
    surname: new FormControl("Smith"),
  };

  private form = new FormGroup(this.formGroupControls);

  get isValid(): boolean {
    return this.form.valid;
  }

  constructor(private readonly cdr: ChangeDetectorRef) {
    this.form.valueChanges.pipe(startWith(this.form.value)).subscribe((_) => {
      this.nickname = (_.name + " " + _.surname).trim();
    });

    setTimeout(() => {
      this.rows = [
        ...this.rows,
        { name: "August", surname: "Alberto", age: 39.5 },
      ];
      this.cdr.markForCheck();
    }, 1000);
  }

  createComponents(showhello = false) {
    const { name: nameCtrl, surname: surnameCtrl } = this.formGroupControls;

    const name = useInput({ control: nameCtrl, placeholder: "Name" }, ["name"]);
    const surname = useComponent(
      ngTextInput,
      {
        control: surnameCtrl,
        placeholder: "Surname",
      },
      ["surname"]
    );

    const farewell = useComponent(
      farewellComponentDefinition,
      () => ({ nickname: this.nickname }),
      ["farewell"]
    );

    const hello = useComponent(
      helloComponentDefinition,
      () => ({ name: this.nickname }),
      ["farewell"]
    );

    return {
      name,
      surname,
      call: showhello ? hello : farewell,
    };
  }
}
