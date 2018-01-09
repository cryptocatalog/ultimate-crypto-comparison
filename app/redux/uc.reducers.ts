import { IUCAppState, UcAppState } from './uc.app-state';
import { UCAction, UCDataUpdateAction, UCRouterAction } from './uc.action';
import { DataService } from '../components/comparison/components/data/data.service';
import { Criteria, CriteriaType } from '../components/comparison/components/configuration/configuration';
import { Data, Label, Markdown, Text, Url } from '../components/comparison/components/data/data';
import { isNullOrUndefined } from 'util';

export const UPDATE_SEARCH = 'UPDATE_SEARCH';
export const UPDATE_MODAL = 'UPDATE_MODAL';
export const UPDATE_FILTER = 'UPDATE_FILTER';
export const UPDATE_DATA = 'UPDATE_DATA';
const UPDATE_ROUTE = 'ROUTER_NAVIGATION';

export function masterReducer(state: IUCAppState = new UcAppState(), action: UCAction) {
    console.log(action.type);
    if (action.type === UPDATE_ROUTE) {
        state.currentElements = [];
        state.currentSearch = new Map();
        state.currentFilter = [];
        state.currentDetails = -1;
    }
    switch (action.type) {
        case UPDATE_SEARCH:
            state = searchReducer(state, action);
            break;
        case UPDATE_MODAL:
            state = detailsReducer(state, action);
            break;
        case UPDATE_FILTER:
            state = filterReducer(state, action);
            break;
        case UPDATE_ROUTE:
            state = routeReducer(state, <UCRouterAction>action);
            break;
        case UPDATE_DATA:
            state.criterias = (<UCDataUpdateAction>action).criterias;
            state = filterColumns(state);
    }
    return updateElements(state);
}

function updateElements(state: IUCAppState): IUCAppState {
    state = filterElements(state);
    state = sortElements(state);
    return state;
}

function filterColumns(state: IUCAppState, columns: Map<string, boolean> = new Map()): IUCAppState {
    if (state.criterias === null) {
        return state;
    }

    const currentColumns = [];
    state.criterias.forEach((value, key) => {
        if (columns.has(key) && columns.get(key)) {
            currentColumns.push(key);
        } else if (!columns.has(key) && value.table) {
            currentColumns.push(key);
        }
    });
    state.currentColumns = currentColumns;

    const columnNames = [];
    const columnTypes = [];
    currentColumns.forEach(key => {
        const criteria: Criteria = state.criterias.get(key);
        columnNames.push(criteria.name);
        columnTypes.push(criteria.type);
    });
    state.columnNames = columnNames;
    state.columnTypes = columnTypes;

    return state;
}

function filterElements(state: IUCAppState, criterias: Map<string, Criteria> = null) {
    if (state.criterias === null) {
        state.criterias = criterias;
    }
    if (state.criterias === null) {
        return state;
    }
    const data: Array<Data> = DataService.data;
    const elements: Array<Array<String | Array<Label> | Text | Url | Markdown | number>> = [];
    const indexes: Array<number> = [];


    for (let i = data.length - 1; i >= 0; i--) {
        if (state.currentFilter.indexOf(i) !== -1) {
            continue;
        }
        let includeData = true;
        for (const field of state.currentSearch.keys()) {
            let fulfillsField = criterias.get(field).andSearch;
            for (const query of state.currentSearch.get(field)) {
                let fulfillsQuery = false;
                for (const key of (<Map<string, any>>data[i].criteria.get(field)).keys()) {
                    if (criterias.get(field).rangeSearch) {
                        fulfillsQuery = fulfillsQuery || numberQueryContains(query, key);
                    } else {
                        fulfillsQuery = fulfillsQuery || (key === query);
                    }
                }
                if (criterias.get(field).andSearch) {
                    fulfillsField = fulfillsField && fulfillsQuery;
                } else {
                    fulfillsField = fulfillsField || fulfillsQuery;
                }
            }
            includeData = includeData && fulfillsField;
        }

        if (includeData) {
            const dataElement: Data = data[i];
            const item: Array<Array<Label> | Text | Url | Markdown | number> = [];
            state.currentColumns.forEach((key, index) => {
                const obj: any = dataElement.criteria.get(key);
                if (state.columnTypes[index] === CriteriaType.label) {
                    const labelMap: Map<string, Label> = obj || new Map;
                    let labels: Array<Label> = [];
                    labelMap.forEach(label => labels.push(label));
                    item.push(labels);
                } else if (state.columnTypes[index] === CriteriaType.rating) {
                    item.push(dataElement.averageRating);
                } else {
                    item.push(obj);
                }
            });

            elements.push(item);
            indexes.push(i);

        }
    }
    state.rowIndexes = indexes;
    state.currentElements = elements;
    console.log(state);
    return state;
}

function sortElements(state: IUCAppState): IUCAppState {
    if (state.currentOrder === null) {
        return state;
    }
    const keys: Array<number> = state.currentOrder.map(value => {
        const key: string = value.substring(1);
        if (state.currentColumns.indexOf(key) !== -1) {
            return state.currentColumns.indexOf(key);
        } else {
            return 0;
        }
    });
    const direction: Array<number> = state.currentOrder.map(key => {
        if (key.startsWith('+')) {
            return 1;
        } else if (key.startsWith('-')) {
            return -1;
        } else {
            // Default is positive (ascending)
            return 1;
        }
    });

    const combined: Array<{
        currentElements: Array<String | Array<Label> | Text | Url | Markdown | number>,
        indexes: number
    }> = [];
    state.currentElements.forEach((value, index) => combined.push({
        currentElements: value,
        indexes: state.rowIndexes[index]
    }));
    combined.sort((a, b) => sort(a.currentElements, b.currentElements, state.columnTypes, keys, direction));
    state.currentElements = combined.map(element => element.currentElements);
    state.rowIndexes = combined.map(element => element.indexes);

    console.log(state);
    return state;
}

function sort(first: Array<String | Array<Label> | Text | Url | Markdown | number>,
              second: Array<String | Array<Label> | Text | Url | Markdown | number>,
              types: Array<CriteriaType>,
              keys: Array<number>,
              directions: Array<number>) {
    const stringCompare = (s1: string, s2: string) => s1 > s2 ? -1 : 1;
    const numberCompare = (n1: number, n2: number) => n1 > n2 ? -1 : 1;

    if (isNullOrUndefined(first) && isNullOrUndefined(second) || first.length === 0 && second.length === 0) {
        return 0;
    }
    if (isNullOrUndefined(first) || first.length === 0 && second.length > 0) {
        return -1;
    }
    if (isNullOrUndefined(first) || first.length > 0 && second.length === 0) {
        return 1;
    }

    let result = 0;
    let index = 0;
    while (result === 0 && index < keys.length) {
        const a = first[keys[index]];
        const b = second[keys[index]];
        if (isNullOrUndefined(a) && isNullOrUndefined(b)) {
            result = 0;
        } else if (isNullOrUndefined(a)) {
            result = 1;
        } else if (isNullOrUndefined(b)) {
            result = -1;
        } else {
            switch (types[index]) {
                case 'repository':
                case 'url':
                    const s1: string = <string>a;
                    const s2: string = <string>b;
                    result = stringCompare(s1, s2);
                    break;
                case 'text':
                    const t1: Text = <Text>a;
                    const t2: Text = <Text>b;
                    result = stringCompare(t1.content, t2.content);
                    break;
                case 'markdown':
                    const md1: Markdown = <Markdown>a;
                    const md2: Markdown = <Markdown>b;
                    result = stringCompare(md1.content, md2.content);
                    break;
                case 'rating':
                    const r1: number = <number>a;
                    const r2: number = <number>b;
                    result = numberCompare(r1, r2);
                    break;
                case 'label':
                    const la1: Array<Label> = <Array<Label>>a;
                    const la2: Array<Label> = <Array<Label>>b;

                    // TODO improve label sorting (label weighting...)
                    const l1: Label = la1[0];
                    const l2: Label = la2[0];
                    if (isNullOrUndefined(l1) && isNullOrUndefined(l2)) {
                        result = 0;
                    } else if (isNullOrUndefined(l1)) {
                        result = 1;
                    } else if (isNullOrUndefined(l2)) {
                        result = -1;
                    } else {
                        stringCompare(l1[0].name, l2.name)
                    }
                    break;
                default:
                    result = 0;
            }
        }
        if (result === 0) {
            index++;
        }
    }
    return directions[index] * result;
}

function numberQueryContains(query: string, value: string): boolean {
    const v = Number.parseInt(value);
    if (Number.isNaN(v)) {
        return false;
    }
    return query.split(',').map(x => x.trim()).map(q => {
        const splits = q.split('-');
        if (splits.length === 1) {
            // single number that is positive (length === 1)
            const n = Number.parseInt(q.replace(' ', ''));
            return n === v;
        } else if (splits.length === 2 && (splits[0].trim().length === 0 || splits[1].trim().length === 0)) {
            // single number that is negative (includes cases like " - 1"
            const n = Number.parseInt(q.replace(' ', ''));
            return n === v;
        } else if (splits.length === 2) {
            // two positive numbers describing a range
            const n1 = Number.parseInt(splits[0].replace(' ', ''));
            const n2 = Number.parseInt(splits[1].replace(' ', ''));
            if (n1 < n2) {
                return n1 <= v && v <= n2;
            } else {
                return n2 <= v && v <= n1;
            }
        } else if (splits.length === 3) {
            // one negative number included, either first one or last one
            let n1, n2;
            if (splits[0].trim().length === 0) {
                // first number negative
                n1 = -Number.parseInt(splits[1].replace(' ', ''));
                n2 = Number.parseInt(splits[2].replace(' ', ''));
            } else if (splits[1].trim().length === 0) {
                // second number is negative
                n2 = Number.parseInt(splits[0].replace(' ', ''));
                n1 = -Number.parseInt(splits[2].replace(' ', ''));
            } else {
                // wrong format of number (eg "1-1-1") return false to ignore
                return false;
            }
            // invariant: n1 is negative and n2 is positive
            return n1 <= v && v <= n2;
        } else if (splits.length === 4 && splits[0].trim().length === 0 && splits[2].trim().length === 0) {
            // both numbers are negative
            const n1 = -Number.parseInt(splits[1].replace(' ', ''));
            const n2 = -Number.parseInt(splits[3].replace(' ', ''));
            if (n1 < n2) {
                return n1 <= v && v <= n2;
            } else {
                return n2 <= v && v <= n1;
            }
        } else {
            // error, wrong format, return false to ignore
            return false;
        }
    }).reduce(((previousValue, currentValue) => previousValue || currentValue));
}

function routeReducer(state: IUCAppState = new UcAppState(), action: UCRouterAction) {
    if (action.type !== UPDATE_ROUTE) {
        return state;
    }
    const params = action.payload.routerState.queryParams;
    const search = params.search || '';
    const filter = params.filter || '';
    const detailsDialog = Number.parseInt(params.details || -1);
    const optionsDialog = params.hasOwnProperty('options');
    const columns = params.columns || '';
    const maximized = params.hasOwnProperty('maximized');
    const order = params.order || ['+id'];

    search.split(';').map(x => x.trim()).forEach(x => {
        const splits = x.split(':');
        if (splits.length > 1) {
            // at least one filter is active
            const key = splits.splice(0, 1);
            state.currentSearch.set(key[0], splits);
        }
    });
    state.currentFilter = filter.split(',').map(x => Number.parseInt(x.trim()));
    state.currentColumns = columns.split(',').map(x => Number.parseInt(x.trim()));
    state.currentlyMaximized = maximized;
    state.currentOrder = order;
    console.log(state);
    return state;
}

function filterReducer(state: IUCAppState = new UcAppState(), action: UCAction) {
    return state;
}

function detailsReducer(state: IUCAppState = new UcAppState(), action: UCAction) {
    return state;
}

function searchReducer(state: IUCAppState = new UcAppState(), action: UCAction) {
    return state;
}
