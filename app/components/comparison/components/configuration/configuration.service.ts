import { ChangeDetectorRef, EventEmitter, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import * as yaml from 'js-yaml';
import {
    Body,
    Citation,
    Configuration,
    Criteria,
    CriteriaValue,
    Details,
    getCriteriaType,
    Header
} from './configuration';
import * as Showdown from 'showdown';
import { DataService } from '../data/data.service';

@Injectable()
export class ConfigurationService {
    public configuration: Configuration = new Configuration.Builder().build();
    public description = '';
    public criteria: Array<Criteria> = [];
    // TODO move to redux
    public tableColumns: Array<string> = [];
    private converter: Showdown.Converter;

    public initializeData: EventEmitter<any> = new EventEmitter();

    static getHtml(converter: Showdown.Converter, citation: Map<string, Citation>, markdown: string): string {
        return converter.makeHtml(markdown).replace(/(?:\[@)([^\]]*)(?:\])/g, (match, dec) => {
            return '<a class="cite-link" href="#' + dec + '">[' + citation.get(dec).index + ']</a>';
        });
    }

    constructor(public title: Title,
                private http: HttpClient,
                private dataService: DataService) {
        this.converter = new Showdown.Converter();
        this.dataService.setSubscriber(this);
    }

    public loadComparison(cd: ChangeDetectorRef) {
        this.http.get('comparison-configuration/comparison.yml', {responseType: 'text'})
            .subscribe(res => {
                const comparisonObject: any = yaml.safeLoad(res) || {};
                const detailsObject: any = comparisonObject.details || {};
                const headerObject: any = detailsObject.header || {};
                const bodyObject: any = detailsObject.body || {};
                const criteriaArray = comparisonObject.criteria || [];
                const citationObject = comparisonObject.autoBibtex || {};
                const autoCriteria = comparisonObject.autoCriteria || {};
                const autoColor = comparisonObject.autoColor || {};

                const detailsHeader: Header = new Header.Builder()
                    .setNameRef(headerObject.nameRef)
                    .setUrlRef(headerObject.urlRef)
                    .build();

                const detailsBody: Body = new Body.Builder()
                    .setTitle(bodyObject.title)
                    .setBodyRef(bodyObject.bodyRef)
                    .build();

                const details: Details = new Details.Builder()
                    .setHeader(detailsHeader)
                    .setBody(detailsBody)
                    .build();

                const criteria: Map<string, Criteria> = new Map<string, Criteria>();
                criteriaArray.forEach((obj) => Object.keys(obj).forEach((key) => {
                    const value = obj[key];
                    if (value == null) {
                        criteria.set(key, new Criteria.Builder().build());
                        return;
                    }

                    const autoColorCriteria = autoColor[key] || {};
                    const valuesObject = value.values || {};

                    const values: Map<string, CriteriaValue> = new Map<string, CriteriaValue>();
                    Object.keys(valuesObject).forEach(objKey => {
                        const v = valuesObject[objKey];
                        const autoColorValue = autoColorCriteria[objKey] || {};

                        if (v == null) {
                            values.set(objKey, new CriteriaValue.Builder().build());
                            return;
                        }
                        values.set(objKey, new CriteriaValue.Builder()
                            .setCriteria(key)
                            .setName(objKey)
                            .setDescription(v.description)
                            .setClazz(v.class)
                            .setColor(v.color || autoColorValue.color)
                            .setBackgroundColor(v.backgroundColor || autoColorValue.backgroundColor)
                            .setWeight(v.weight)
                            .setMinAge(v.minAge)
                            .setMaxAge(v.maxAge)
                            .setMinAgeUnit(v.minAgeUnit)
                            .setMaxAgeUnit(v.maxAgeUnit)
                            .build()
                        );
                    });

                    criteria.set(key, new Criteria.Builder()
                        .setName(value.name || key)
                        .setSearch(value.search)
                        .setTable(value.table)
                        .setDetail(value.detail)
                        .setType(getCriteriaType(value.type))
                        .setDescription(value.description)
                        .setPlaceholder(value.placeholder)
                        .setAndSearch(value.andSearch)
                        .setRangeSearch(value.rangeSearch)
                        .setValues(values)
                        .build()
                    );
                }));

                Object.keys(autoCriteria).forEach((key) => {
                    const valuesObject = autoCriteria[key];

                    if (criteria.get(key)) {
                        const old: Criteria = criteria.get(key);
                        const values: Map<string, CriteriaValue> = new Map<string, CriteriaValue>();
                        Object.keys(valuesObject).forEach(valueKey => {
                            const oldValue: CriteriaValue = old.values.get(valueKey);
                            const value = valuesObject[valueKey];
                            if (oldValue != null) {
                                values.set(valueKey, old.values.get(valueKey));
                            } else if (value == null) {
                                values.set(valueKey, new CriteriaValue.Builder().setCriteria(key).setName(valueKey).build());
                            } else if (value != null) {
                                values.set(valueKey, new CriteriaValue.Builder()
                                    .setCriteria(key)
                                    .setName(valueKey)
                                    .setDescription(value.description)
                                    .setClazz(value.class)
                                    .setWeight(value.weight)
                                    .setMinAge(value.minAge)
                                    .setMaxAge(value.maxAge)
                                    .setMinAgeUnit(value.minAgeUnit)
                                    .setMaxAgeUnit(value.maxAgeUnit)
                                    .build());
                            }
                        });

                        criteria.set(key, new Criteria.Builder()
                            .setName(old.name)
                            .setSearch(old.search)
                            .setTable(old.table)
                            .setDetail(old.detail)
                            .setType(old.type)
                            .setDescription(old.description)
                            .setPlaceholder(old.placeholder)
                            .setAndSearch(old.andSearch)
                            .setRangeSearch(old.rangeSearch)
                            .setValues(values)
                            .build());
                    } else {
                        const values: Map<string, CriteriaValue> = new Map<string, CriteriaValue>();
                        Object.keys(valuesObject).forEach(valueKey => {
                            const value = valuesObject[valueKey];
                            if (value == null) {
                                values.set(valueKey, new CriteriaValue.Builder().setCriteria(key).setName(valueKey).build());
                            } else if (value != null) {
                                values.set(valueKey, new CriteriaValue.Builder()
                                    .setCriteria(key)
                                    .setName(valueKey)
                                    .setDescription(value.description)
                                    .setClazz(value.class)
                                    .setWeight(value.weight)
                                    .setMinAge(value.minAge)
                                    .setMaxAge(value.maxAge)
                                    .setMinAgeUnit(value.minAgeUnit)
                                    .setMaxAgeUnit(value.maxAgeUnit)
                                    .build());
                            }
                        });

                        criteria.set(key, new Criteria.Builder()
                            .setName(key)
                            .setValues(values)
                            .build());
                    }
                });

                const citation: Map<string, Citation> = new Map<string, Citation>();
                Object.keys(citationObject).forEach(
                    citationKey => {
                        const value = citationObject[citationKey];
                        citation.set(citationKey, new Citation.Builder()
                            .setIndex(value.index)
                            .setKey(citationKey)
                            .setText(value.value)
                            .build()
                        )
                    }
                );

                this.configuration = new Configuration.Builder()
                    .setTitle(comparisonObject.title)
                    .setSubtitle(comparisonObject.subtitle)
                    .setSelectTitle(comparisonObject.selectTitle)
                    .setTableTitle(comparisonObject.tableTitle)
                    .setRepository(comparisonObject.repository)
                    .setDetails(details)
                    .setCriteria(criteria)
                    .setCitation(citation)
                    .build();

                this.initializeData.emit({configuration: this.configuration, dataService: this.dataService, cd: cd});

                this.title.setTitle(this.configuration.title);
                this.loadDescription(citation);

                criteria.forEach((value, key) => {
                    if (value.search) {
                        this.criteria.push(value);
                    }
                    if (value.table) {
                        this.tableColumns.push(key);
                    }
                });
                cd.markForCheck();
            });
    }

    public loadDescription(citation: Map<string, Citation>) {
        this.http.get('comparison-configuration/description.md', {responseType: 'text'})
            .subscribe(res => {
                this.description = ConfigurationService.getHtml(this.converter, citation, res);
            });
    }
}
