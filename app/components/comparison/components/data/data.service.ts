import { ChangeDetectorRef, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Showdown from 'showdown';
import { Data, Label, Markdown, Rating, Text, Tooltip, Url } from './data';
import { Configuration, Criteria, CriteriaType, CriteriaValue } from '../configuration/configuration';
import { ConfigurationService } from '../configuration/configuration.service';
import { UCDataUpdateAction } from '../../../../redux/uc.action';
import { Store } from '@ngrx/store';
import { IUCAppState } from '../../../../redux/uc.app-state';

@Injectable()
export class DataService {
    public static data: Array<Data> = [];

    private converter: Showdown.Converter;

    constructor(private http: HttpClient,
                private store: Store<IUCAppState>) {
        this.converter = new Showdown.Converter();
    }

    public setSubscriber(configurationService: ConfigurationService) {
        configurationService.initializeData.subscribe(this.loadData)
    }

    private loadData(value: {configuration: Configuration; dataService: DataService, cd: ChangeDetectorRef; }) {
        const configuration = value.configuration;
        const dataService = value.dataService;
        const cd = value.cd;
        dataService.http.get('app/components/comparison/data/data.json')
            .subscribe(res => {
                const dataArrayObject: Array<any> = <Array<any>>res || [];
                const data: Array<Data> = [];

                dataArrayObject.forEach(dataObject => {
                    const regArray =
                        /^((?:(?:\w+\s*)(?:-?\s*\w+.)*)+)\s*-?\s*((?:(?:http|ftp|https)(?::\/\/)(?:[\w_-]+(?:(?:\.[\w_-]+)+))|(?:www.))(?:[\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?)$/gi
                            .exec(dataObject.tag);
                    const name: string = ((regArray && regArray.length > 1) ? regArray[1] : dataObject.tag || '').trim();

                    let url: string = ((regArray && regArray.length > 2) ? regArray[2] : dataObject.tag || '').trim();
                    if (/^(www)/.test(url)) {
                        url = 'http://'.concat(url);
                    }
                    let averageRating = 0;

                    const criteria: Map<string, Map<string, Label> | Text | Url | Markdown | Array<Rating>> =
                        new Map<string, Map<string, Label> | Text | Markdown | Array<Rating>>();
                    Object.keys(dataObject).forEach(criteriaKey => {
                            const criteriaObject = dataObject[criteriaKey];

                            if (criteriaObject == null) {
                                return;
                            }

                            if (criteriaKey === 'tag') {
                                const crit: Criteria = configuration.criteria.get('id');
                                const type: CriteriaType = crit ? crit.type : CriteriaType.url;
                                switch (type) {
                                    case CriteriaType.text:
                                        criteria.set('id', new Text(name));
                                        break;
                                    case CriteriaType.markdown:
                                        criteria.set('id', new Markdown(name, dataService.converter.makeHtml(name)));
                                        break;
                                    case CriteriaType.label:
                                        const labels: Map<string, Label> = new Map<string, Label>();
                                        labels.set(name, new Label.Builder().setName(name).build());
                                        criteria.set('id', labels);
                                        break;
                                    default:
                                        criteria.set('id', new Url(name, url));
                                }
                                return;
                            }
                            if (criteriaKey === 'descr') {
                                const crit: Criteria = configuration.criteria.get('description');
                                const type: CriteriaType = crit ? crit.type : CriteriaType.url;
                                switch (type) {
                                    case CriteriaType.text:
                                        criteria.set('description', new Text(criteriaObject));
                                        break;
                                    case CriteriaType.markdown:
                                        criteria.set('description',
                                            new Markdown(criteriaObject,
                                            ConfigurationService.getHtml(dataService.converter, configuration.citation, criteriaObject)));
                                        break;
                                    case CriteriaType.label:
                                        const labels: Map<string, Label> = new Map<string, Label>();
                                        labels.set(criteriaObject, new Label.Builder().setName(criteriaObject).build());
                                        criteria.set('description', labels);
                                        break;
                                    default:
                                        criteria.set('description', new Url(criteriaObject, url));
                                }
                                return;
                            }

                            const criteriaConf: Criteria = configuration.criteria.get(criteriaKey) || new Criteria.Builder().build();
                            const childs = criteriaObject.childs || {};
                            const childsArrayLvl1 = childs['0'] || [];
                            const childsArray = childsArrayLvl1.length > 0 ? childsArrayLvl1[0] : [];

                            switch (criteriaConf.type) {
                                case CriteriaType.text:
                                    criteria.set(criteriaKey, new Text(criteriaObject.plain));
                                    break;
                                case CriteriaType.markdown:
                                    criteria.set(criteriaKey,
                                        new Markdown(criteriaObject.plain,
                                        dataService.converter.makeHtml(criteriaObject.plain)));
                                    break;
                                case CriteriaType.url:
                                    criteria.set(criteriaObject.plain, new Url(criteriaObject.plain, criteriaObject.plain));
                                    break;
                                case CriteriaType.rating:
                                    const ratings: Array<Rating> = [];
                                    let sum = 0;

                                    if (typeof childsArray !== 'string') {
                                        childsArray.forEach(ratingObject => {
                                            const starsString: string = /\[(\d*)]/gm.exec(ratingObject.content)[1];
                                            const stars: number = parseInt(starsString, 10);
                                            sum += stars;
                                            const comment: string = /(?:\[\d*])((?:.|\n)*)/gm.exec(ratingObject.content)[1];
                                            ratings.push(new Rating(stars, comment));
                                        });
                                    }
                                    if (ratings.length !== 0) {
                                        averageRating = sum / ratings.length;
                                    }

                                    criteria.set(criteriaKey, ratings);
                                    break;
                                default:
                                    const labels: Map<string, Label> = new Map<string, Label>();

                                    if (typeof childsArray !== 'string') {
                                        childsArray.forEach(labelObject => {
                                            const criteriaValueConf: CriteriaValue =
                                                criteriaConf.values.get(labelObject.content) || new CriteriaValue.Builder().build();
                                            const tooltipArray = labelObject.childs || [];
                                            let htmlTooltip = '';
                                            let latexTooltip = '';
                                            if (tooltipArray.length === 1) {
                                                htmlTooltip = (tooltipArray[0].plain || '').trim();
                                            } else {
                                                htmlTooltip = labelObject.plainChilds.replace(/^[\s]{3}/gm, '');
                                                if (htmlTooltip) {
                                                    latexTooltip = htmlTooltip.replace(/[\s]{2}/gm, ' ');
                                                    latexTooltip = latexTooltip.replace(/[\s]/gm, ' ');
                                                }
                                            }
                                            htmlTooltip = ConfigurationService.getHtml(
                                                dataService.converter,
                                                configuration.citation,
                                                htmlTooltip
                                            );
                                            const tooltip: Tooltip = new Tooltip(criteriaValueConf.description, htmlTooltip, latexTooltip);

                                            labels.set(labelObject.content, new Label.Builder()
                                                .setName(labelObject.content)
                                                .setTooltip(tooltip)
                                                .setClazz(criteriaValueConf.clazz)
                                                .setColor(criteriaValueConf.color)
                                                .setBackgroundColor(criteriaValueConf.backgroundColor)
                                                .build());
                                        });
                                    }

                                    criteria.set(criteriaKey, labels);
                            }

                        }
                    );

                    data.push(new Data.Builder().setName(name)
                        .setUrl(url)
                        .setCriteria(criteria)
                        .setAverageRating(averageRating)
                        .build());

                });

                DataService.data = data;
                dataService.store.dispatch(new UCDataUpdateAction(configuration.criteria));
                cd.markForCheck();
            });
    }
}
