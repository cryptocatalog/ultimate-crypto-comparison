import { Action } from '@ngrx/store';
import { CriteriaSelection } from '../components/comparison/shared/components/criteria-selection';
import { PaperDialogComponent } from '../components/polymer/paper-dialog/paper-dialog.component';
import { Criteria } from '../components/comparison/shared/components/criteria';

export class UCAction implements Action {
    type: string;
    value: PaperDialogComponent | CriteriaSelection | {keyboard: KeyboardEvent, criteria: Criteria};
}
