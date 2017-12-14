import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { PipesModule } from "./../pipes/pipes.module";
import { PolymerModule } from "./../polymer/polymer.module";
import { GenericTableComponent } from "./generic-table/generic-table.component";
import { ReferencesTableComponent } from "./references-table/references-table.component";
import { LatexTableComponent } from './latex-table/latex-table.component';

@NgModule({
    imports: [
        BrowserModule,
        PipesModule,
        PolymerModule
    ],
    exports: [
        GenericTableComponent,
        ReferencesTableComponent,
        PolymerModule,
        LatexTableComponent
    ],
    declarations: [
        GenericTableComponent,
        ReferencesTableComponent,
        LatexTableComponent
    ],
    providers: []
})
export class OutputModule {
}