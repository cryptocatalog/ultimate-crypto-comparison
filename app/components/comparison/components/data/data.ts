export class Data {
    public name: string;
    public url: string;
    public criteria: Map<string, Map<string, Label> | Text | Url | Markdown | Array<Rating>>;
    public averageRating: number;

    constructor(builder) {
        this.name = builder.name;
        this.url = builder.url;
        this.criteria = builder.criteria;
        this.averageRating = builder.averageRating || 0;
    }

    static get Builder() {
        class Builder {
            private name: string;
            private url: string;
            private criteria: Map<string, Map<string, Label> | Text | Url | Markdown | Array<Rating>>;
            private averageRating: number;

            setName(value: string): Builder {
                this.name = value;
                return this;
            }

            setUrl(value: string): Builder {
                this.url = value;
                return this;
            }

            setCriteria(value: Map<string, Map<string, Label> | Text | Url | Markdown | Array<Rating>>): Builder {
                this.criteria = value;
                return this;
            }

            setAverageRating(value: number): Builder {
                this.averageRating = value;
                return this;
            }

            build() {
                return new Data(this);
            }
        }

        return Builder;
    }
}

export class Label {
    public name: string;
    public tooltip: Tooltip;
    public clazz: string;
    public color: string;
    public backgroundColor: string;

    constructor(builder) {
        this.name = builder.name || "";
        this.tooltip = builder.tooltip || new Tooltip(null, null, null);
        this.clazz = builder.clazz || "";
        this.color = builder.color || "";
        this.backgroundColor = builder.backgroundColor || "";
    }

    static get Builder() {
        class Builder {
            private name: string;
            private tooltip: Tooltip;
            private clazz: string;
            private color: string;
            private backgroundColor: string;


            setName(value: string): Builder {
                this.name = value;
                return this;
            }

            setTooltip(value: Tooltip): Builder {
                this.tooltip = value;
                return this;
            }

            setClazz(value: string): Builder {
                this.clazz = value;
                return this;
            }

            setColor(value: string): Builder {
                this.color = value;
                return this;
            }

            setBackgroundColor(value: string): Builder {
                this.backgroundColor = value;
                return this;
            }

            build() {
                return new Label(this);
            }
        }

        return Builder;
    }
}

export class Text {
    public content: string;

    constructor(content: string) {
        this.content = content || "";
    }
}

export class Url {
    public text: string;
    public link: string;

    constructor(text: string, link: string) {
        this.text = text || link || "";
        this.link = link || "";
    }
}

export class Markdown {
    public content: string;
    public htmlContent: string;

    constructor(content: string, htmlContent: string) {
        this.content = content || "";
        this.htmlContent = htmlContent || "";
    }
}

export class Rating {
    public stars: number;
    public comment: string;

    constructor(stars: number, comment: string) {
        this.stars = stars || 0;
        this.comment = comment || "";
    }
}

export class Tooltip {
    public text: string;
    public html: string;
    public latex: string;

    constructor(text: string, html: string, latex: string) {
        this.text = text || "";
        this.html = html || "";
        this.latex = latex || "";
    }
}