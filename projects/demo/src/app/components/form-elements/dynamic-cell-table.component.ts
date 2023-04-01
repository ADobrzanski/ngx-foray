import { Component, Input } from "@angular/core";
import { Table } from "primeng/table";

@Component({
    selector: 'app-dynamic-cell-table',
    template: `
        <p-table [columns]="columns" [value]="value" [tableStyle]="{'min-width': '50rem'}">
            <ng-template pTemplate="header" let-columns>
                <tr>
                    <th *ngFor="let col of columns">
                        {{col.header}}
                    </th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-rowData let-columns="columns">
                <tr>
                    <td *ngFor="let col of columns">
                        <ng-container *ngIf="col.cell" [ngxDynamicComponent]="col.cell(rowData)"></ng-container>
                        <ng-container *ngIf="!col.cell">{{rowData[col.field]}}</ng-container>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    `
})
export class DynamicCellTableComponent {
    @Input() value: Table['value'] = [];
    @Input() columns: Table['columns'] = [];
}