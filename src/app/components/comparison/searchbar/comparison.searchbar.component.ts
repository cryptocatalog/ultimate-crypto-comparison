import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ConfigurationService } from "../configuration/configuration.service";
import { Data, Label, Markdown, Rating, Text, Url } from "../data/data";
import { Criteria } from "../configuration/configuration";
import { isNullOrUndefined } from "util";

@Component({
    selector: 'comparison-details',
    templateUrl: './comparison.searchbar.template.html',
    styleUrls: ['./comparison.searchbar.component.css']
})
export class ComparisonDetailsComponent implements OnChanges {
    @Input() data: Data = new Data.Builder().build();

    constructor(public configurationService: ConfigurationService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        //
    }
}
