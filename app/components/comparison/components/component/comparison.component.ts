import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { VersionInformation } from '../../../../VersionInformation';
import { PaperCardComponent } from "../../../polymer/paper-card/paper-card.component";
import { LatexTableComponent } from '../../../output/latex-table/latex-table.component';
import { Store } from '@ngrx/store';
import { IUCAppState } from '../../../../redux/uc.app-state';
import { ConfigurationService } from "../configuration/configuration.service";
import { Criteria } from "../configuration/configuration";
import { DataService } from "../data/data.service";
import { Data } from "../data/data";
import { UCTableOrderAction } from "../../../../redux/uc.action";
import { isNullOrUndefined } from "util";

// TODO evaluate how winery saves files
const FileSaver = require('file-saver');

@Component({
    selector: 'comparison',
    templateUrl: './comparison.template.html',
    styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent {
    @ViewChild(LatexTableComponent) latexTable: LatexTableComponent;
    @ViewChild('genericTableHeader') genericTableHeader: PaperCardComponent;
    public activeRow: Data = new Data.Builder().build();

    public detailsOpen: boolean = false;
    public settingsOpen: boolean = false;

    public changed = 0;
    private versionInformation: VersionInformation = new VersionInformation();

    constructor(public configurationService: ConfigurationService,
                private cd: ChangeDetectorRef,
                public store: Store<IUCAppState>) {
        this.configurationService.loadComparison(this.cd);
        store.subscribe(res => console.log(res));
    }

    public getVersionInformation(): VersionInformation {
        return this.versionInformation;
    }

    public criteriaChanged(value: Array<String> | KeyboardEvent | { target: { value: string } }, crit: Criteria) {
        if (value) {
            //this.store.dispatch({type: UPDATE_SEARCH, value: new CriteriaSelection(value, crit)});
        }
        this.cd.markForCheck();
    }

    public showDetails(index: number) {
        this.activeRow = DataService.data[index];
        this.detailsOpen = true;
    }

    public deferredUpdate() {
        setTimeout(() => {
            this.changed > 0 ? (this.changed = this.changed - 100) : (this.changed = this.changed + 100);
        }, 100);
    }

    public latexDownload() {
        let content: string = this.latexTable.element.nativeElement.textContent;
        content = content.substr(content.indexOf('%'), content.length);
        const blob: Blob = new Blob([content], {type: 'plain/text'});
        FileSaver.saveAs(blob, 'latextable.tex');
        return window.URL.createObjectURL(blob);
    }

    /**
     * Callback functions dispatching to redux store
     */
    public changeOrder(change: { index: number, ctrl: boolean }) {
        if (!isNullOrUndefined(change)) {
            this.store.dispatch(new UCTableOrderAction(change.index, change.ctrl));
        }
    }
}
