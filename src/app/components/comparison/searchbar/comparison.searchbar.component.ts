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
export class ComparisonSearchbarComponent {
    public static components: Array<ComparisonSearchbarComponent> = [];
    @Input() value = '';
    @ViewChild('textvalue') content: ElementRef;
    @Output() result: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

    constructor() {
        ComparisonSearchbarComponent.components.push(this);
    }

    public valueChanged() {
        this.result.emit(this.content.nativeElement.value);
    }

    public getValue() {
        if (isNullOrUndefined(this.value)) {
            return '';
        }
        return this.value;
    }
}
