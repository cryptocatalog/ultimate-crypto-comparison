import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Label, Markdown, Text, Url } from "../../comparison/components/data/data";

@Component({
    selector: 'generictable',
    templateUrl: './generic-table.component.html',
    styleUrls: ['./generic-table.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericTableComponent {
    @Input() changeNum = 0;

    @Output() settingsCallback: EventEmitter<any> = new EventEmitter();
    @Output() showDetails: EventEmitter<any> = new EventEmitter();
    @Output() searchFor: EventEmitter<any> = new EventEmitter();
    @Output() orderChange: EventEmitter<any> = new EventEmitter();

    // TODO new inputs: (move to redux store)
    @Input() columns: Array<string> = [];
    @Input() types: Array<string> = [];
    @Input() items: Array<Array<String | Array<Label> | Text | Url | Markdown | number>> = [];
    @Input() index: Array<number> = [];
    @Input() order: Array<number> = [];

    public labelClick(key: string, index: number) {
        this.searchFor.emit({key, index});
    }

    private orderClick(e: MouseEvent, value: number) {
        this.orderChange.emit({index: value, ctrl: e.ctrlKey});
    }
}
