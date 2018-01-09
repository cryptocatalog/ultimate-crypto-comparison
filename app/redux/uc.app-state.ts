import { Label, Markdown, Text, Url } from '../components/comparison/components/data/data';
import { Criteria, CriteriaType } from '../components/comparison/components/configuration/configuration';

export interface IUCAppState {
    /**
     * Which criteria has to fulfill which condition (set at the top of the page in the boxes)
     */
    currentSearch: Map<string, Array<string>>;

    /**
     * Which element's details page should be shown. -1 if none.
     * Index of the element in the data array (DataService.data: Array<Data>)
     */
    currentDetails: number;

    /**
     * Which elements are disabled.
     * Index of the elements in the data array (DataService.data: Array<Data>)
     */
    currentFilter: Array<number>;

    /**
     * Which columns are shown.
     * Keys of the columns (criteria: Map<string, Criteria>)
     */
    currentColumns: Array<string>;

    /**
     * Determines if the table is maximized (all columns are shown) if it is minimized afterwards, it returns to {@see #currentColumns}.
     */
    currentlyMaximized: boolean;

    /**
     * Which columns determine the order of the elements. '-' means descending, '+' ascending.
     * Keys of the columns (criteria: Map<string, Criteria>) with '+'|'-' prefix
     */
    currentOrder: Array<string>;

    /**
     * Current uc configuration
     * Used for currentColumns|currentOrder
     */
    criterias: Map<string, Criteria>;

    /**
     * List of columns that should be shown.
     */
    columnNames: Array<string>;

    /**
     * List of the CriteriaTypes of the columns
     */
    columnTypes: Array<CriteriaType>;

    /**
     * List of row indexes
     */
    rowIndexes: Array<number>;

    /**
     * Which elements should be shown after the filter and the search are applied.
     */
    currentElements: Array<Array<String | Array<Label> | Text | Url | Markdown | number>>;
}

export class UcAppState implements IUCAppState {
    currentSearch: Map<string, Array<string>> = new Map<string, Array<string>>();
    currentDetails = -1;
    currentFilter: Array<number> = [];
    currentColumns: Array<string> = [];
    currentlyMaximized = false;
    currentOrder = ['-id'];
    criterias: Map<string, Criteria> = null;
    columnNames: Array<string> = [];
    columnTypes: Array<CriteriaType> = [];
    rowIndexes: Array<number> = [];
    currentElements: Array<Array<String | Array<Label> | Text | Url | Markdown | number>> = [];
}
