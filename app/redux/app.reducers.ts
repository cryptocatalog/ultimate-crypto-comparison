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
    const newDialog = <PaperDialogComponent>action.value;
    switch (action.type) {
        case UPDATE_MODAL:
            if (isNullOrUndefined(action.value)) {
                state.currentModal.renderer.setStyle(state.currentModal.el.nativeElement, 'display', 'none');
                state.currentModal.el.nativeElement.classList.remove('model-open');
            } else {
                newDialog.renderer.setStyle(newDialog.el.nativeElement, 'display', 'grid');
                newDialog.el.nativeElement.classList.add('model-open');
            }
            state.currentModal = newDialog;
    }
    return state;
}

function mergeFilters(original: { [name: string]: CriteriaSelection }, update: CriteriaSelection): IUCAppState['currentFilter'] {
    if (!isNullOrUndefined(update.criteria)) {
        if (Array.isArray(update.values) && (<Array<string>>update.values).length > 0) {
            original[update.criteria.tag] = update;
        } else if (update.values.constructor.name === 'KeyboardEvent') {
            if (original[update.criteria.name]) {
                console.log((<KeyboardEvent>update.values).srcElement.textContent);
                (<{ target: { value: string } }>original[update.criteria.name].values).target.value += (<KeyboardEvent>update.values).srcElement.getAttribute('value');
            } else if (!original[update.criteria.name]) {
                original[update.criteria.name] = new CriteriaSelection({target: {value: (<KeyboardEvent>update.values).key}}, update.criteria);
            }
        } else if (original.hasOwnProperty(update.criteria.tag)) {
            delete original[update.criteria.tag];
        }
    }
    console.log(original)
    return original;
}
