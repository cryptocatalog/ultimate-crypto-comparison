import { Action } from '@ngrx/store';
import { PaperDialogComponent } from '../components/polymer/paper-dialog/paper-dialog.component';
import { Data } from "../components/comparison/components/data/data";
import { UPDATE_DATA } from './uc.reducers';
import { Criteria } from '../components/comparison/components/configuration/configuration';

export class UCAction implements Action {
    type: string;
    value: number;
}

export class UCRouterAction extends UCAction {
    payload: any;
}

export class UCDataUpdateAction extends UCAction {
    type = UPDATE_DATA;

    constructor(public criterias: Map<string, Criteria>) {
        super();
    }
}
