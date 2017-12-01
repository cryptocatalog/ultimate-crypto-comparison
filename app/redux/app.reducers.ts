import { IUCAppState, UCAppState } from './app.app-state';
import { UCAction } from './app.action';
import { isNullOrUndefined, isUndefined } from 'util';
import { CriteriaSelection } from '../components/comparison/shared/components/criteria-selection';
import { PaperDialogComponent } from '../components/polymer/paper-dialog/paper-dialog.component';

export const UPDATE_FILTER = 'UPDATE_FILTER';
export const UPDATE_MODAL = 'UPDATE_MODAL';

export function filterReducer(state: IUCAppState = new UCAppState(), action: UCAction): IUCAppState {
    if (isUndefined(state)) {
        return new UCAppState();
    }
    switch (action.type) {
        case UPDATE_FILTER: return {
            currentFilter: mergeFilters(state.currentFilter, <CriteriaSelection>action.value),
            currentModal: state.currentModal
        };
    }
    return state;
}

export function modalReducer(state: IUCAppState = new UCAppState(), action: UCAction): IUCAppState {
    if (isUndefined(state)) {
        return new UCAppState();
    }
    switch (action.type) {
        case UPDATE_MODAL: return { currentFilter: state.currentFilter, currentModal: <PaperDialogComponent>action.value };
    }
    return state;
}

function mergeFilters(original: { [name: string]: CriteriaSelection }, update: CriteriaSelection): IUCAppState['currentFilter'] {
    if (!isNullOrUndefined(update.criteria)) {
        if ((<Array<string>>update.values).length > 0) {
            original[update.criteria.tag] = update;
        } else if (original.hasOwnProperty(update.criteria.tag)) {
            delete original[update.criteria.tag];
        }
    }
    return original;
}
