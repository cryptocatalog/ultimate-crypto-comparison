import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { VersionInformation } from '../../../../VersionInformation';
import { PaperCardComponent } from "../../../polymer/paper-card/paper-card.component";
import { LatexTableComponent } from '../../../output/latex-table/latex-table.component';
import { Store } from '@ngrx/store';
import { IUCAppState } from '../../../../redux/uc.app-state';
import { Router } from '@angular/router';
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

    // TODO move to redux
    public detailsOpen: boolean = false;
    public settingsOpen: boolean = false;

    public changed = 7;
    private versionInformation: VersionInformation = new VersionInformation();

    constructor(public dataService: DataService,
                public configurationService: ConfigurationService,
                private cd: ChangeDetectorRef,
                public store: Store<IUCAppState>,
                private router: Router,
                private zone: NgZone) {
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

        this.change();
    }

    public changeEnabled(item: Data) {
        //this.store.dispatch({type: UPDATE_FILTER, value: item, operation: item.enabled ? 1 : -1});
        this.change();
    }

    public change() {
        if (this.changed === 1) {
            this.changed = 0;
        } else {
            this.changed = 1;
        }
    }

    public getActive(state: IUCAppState, crit: Criteria): Array<string> {
        /* for (const el in state.currentSearch) {
             if (state.currentSearch.hasOwnProperty(el) && (crit.name === el || crit.tag === el)) {
                 if (crit.range_search) {
                     return [(<any>state.currentSearch[el].values).target.value];
                 } else {
                     return <Array<string>>state.currentSearch[el].values;
                 }
             }
         }*/
        return [];
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


    /**
     * Callback functions dispatching to redux store
     */
    public changeOrder(change: { index: number, ctrl: boolean }) {
        if (!isNullOrUndefined(change)) {
            this.store.dispatch(new UCTableOrderAction(change.index, change.ctrl));
        }
    }

    private downloadLatexTable() {
        let content: string = this.latexTable.element.nativeElement.textContent;
        content = content.substr(content.indexOf('%'), content.length);
        const blob: Blob = new Blob([content], {type: 'plain/text'});
        FileSaver.saveAs(blob, 'latextable.tex');
        return window.URL.createObjectURL(blob);
    }
}
