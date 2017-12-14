import { Component, Input } from '@angular/core';
import { ConfigurationService } from "../configuration/configuration.service";
import { Data } from "../data/data";

@Component({
    selector: 'comparison-details',
    templateUrl: './comparison.details.template.html',
    styleUrls: ['./comparison.details.component.css']
})
export class ComparisonDetailsComponent {
    @Input() data: Data;

    private opened = false;

    constructor(public configurationService: ConfigurationService) {
    }

    /*
        private getBody(): string {
            let data = <string> this.data.getProperty(this.confServ.configuration.details.body.bodyRef).plain;
            if (isNullOrUndefined(data)) {
                data = String(this.data.getProperty(this.confServ.configuration.details.body.bodyRef).plain);
            }
            const body = this.confServ.configuration ?
                this.serv.converter.makeHtml(data) : '';
            if (body && body !== this.body) {
                this.body = body;
            }
            return this.body;
        }

        private getHeaderText(): string {
            const headerText = this.confServ.configuration ? this.data[this.confServ.configuration.details.header.nameRef] : '';
            if (headerText && headerText !== this.header.text) {
                this.header.text = headerText;
            }
            return this.header.text;
        }


            private getHeaderUrl(): string {
                const headerUrl = this.confServ.comparison ? this.data[this.confServ.comparison.details.header.urlRef] : '';
                if (headerUrl && headerUrl !== this.header.url) {
                    this.header.url = headerUrl;
                }
                return this.header.url;
            }

            private getHeaderColumn(): TableData {
                const headerColumn = (this.confServ.comparison && this.confServ.comparison.details.header.labelRef) ?
                    this.data[this.confServ.comparison.details.header.labelRef] :
                    new TableData();
                if (headerColumn && headerColumn !== this.header.column) {
                    this.header.column = headerColumn;
                }
                return this.header.column;
            }

            private getHeaderLabel(): Type {
                const headerLabel = (this.confServ.comparison && this.confServ.tableDataSet) ?
                    this.confServ.tableDataSet.getTableData(this.confServ.comparison.details.headerLabel).type :
                    new Type();
                if (headerLabel && headerLabel !== this.header.label) {
                    this.header.label = headerLabel;
                }
                return headerLabel;
            }

            private getTable(tag: string): TableData {
                return this.confServ.tableDataSet ? this.confServ.tableDataSet.getTableData(tag) : new TableData();
            }
            */
}
