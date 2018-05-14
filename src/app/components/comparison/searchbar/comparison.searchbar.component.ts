import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { ConfigurationService } from "../configuration/configuration.service";
import { Data, Label, Markdown, Rating, Text, Url } from "../data/data";
import { Criteria } from "../configuration/configuration";
import { isNullOrUndefined } from "util";
import {InputInterface} from "../../input/input-interface";

@Component({
    selector: 'comparison-searchbar',
    templateUrl: './comparison.searchbar.template.html',
    styleUrls: ['./comparison.searchbar.component.css']
})
export class ComparisonSearchbarComponent { // implements OnChanges, InputInterface {
    public static components: Array<ComparisonSearchbarComponent> = [];
    // Input() data: Data = new Data.Builder().build();
    @Input() value = '';
    @ViewChild('textvalue') content: ElementRef;
    @Output() result: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

    constructor() {
        ComparisonSearchbarComponent.components.push(this);
    }

    /*ngOnChanges(changes: SimpleChanges): void {
        //
    }*/

    public valueChanged() {
        this.result.emit(this.content.nativeElement.value);
    }

    public addToGui(item: string): void {
        if (isNullOrUndefined(this.content)) {
            return;
        }

        // regex for finding out if the item is already in the list.
        // tests "^ *item *$", "^ *item *,", ", *item *$", and ", *item *,"
        // these represent following patterns:
        // 1. arbitrary number of spaces, item, arbitrary number of spaces, complete field
        // 2. arbitrary number of spaces, item, arbitrary number of spaces, comma, start of field
        // 3. comma, arbitrary number of spaces, item, arbitrary number of spaces, end of field
        // 4. comma, arbitrary number of spaces, item, arbitrary number of spaces, comma, in the middle of the field
        // The commas are needed to make sure that it matches the complete number instead of partly, because else
        // "13" would match the pattern "3$".
        /*const regex = '(^ *' + item + ' *$|^ *' + item + ' *,|, *' + item + ' *,|, *' + item + ' *$)';
        if (new RegExp(regex).test(this.content.nativeElement.value)) {
            return;
        }*/

        if (this.content.nativeElement.value !== '') {
            item = ', ' + item;
        }
        this.content.nativeElement.value += item;
        this.valueChanged();
    }

    public getValue() {
        if (isNullOrUndefined(this.value)) {
            return '';
        }
        return this.value;
    }
}
