import { Component, ElementRef } from '@angular/core';
import { ConfigurationService } from "../../comparison/components/configuration/configuration.service";

@Component({
    selector: 'latextable',
    templateUrl: './latex-table.component.html',
    styleUrls: ['./latex-table.component.css']
})
export class LatexTableComponent {
    public showTable = false;
    private showTableTooltips = true;
    private tableTooltipsAsFootnotes = false;

    constructor(public confServ: ConfigurationService,
                public element: ElementRef) {
    }
}