import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ComparisonModule } from './components/comparison/index';
import { LocalStorageModule } from 'angular-2-local-storage';
import { StoreModule } from '@ngrx/store';
import { filterReducer, modalReducer } from './redux/app.reducers';
import { RouterModule } from '@angular/router';
import { ComparisonComponent } from './components/comparison/components/comparison.component';
import { RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { APP_BASE_HREF } from '@angular/common';
import { CustomRouterStateSerializer } from './redux/app.state-serializer';

@NgModule({
    imports: [
        BrowserModule,
        ComparisonModule,
        LocalStorageModule.withConfig({
            prefix: 'ultimate-comparison-base',
            storageType: 'localStorage'
        }),
        StoreModule.forRoot({
            currentFilter: filterReducer,
            currentModal: modalReducer
        }),
        RouterModule.forRoot([{
            path: '', component: ComparisonComponent
        }], {useHash: true}),
        StoreRouterConnectingModule
    ],
    declarations: [
        AppComponent,
    ],
    providers: [
        {provide: APP_BASE_HREF, useValue: '/'},
        {provide: RouterStateSerializer, useClass: CustomRouterStateSerializer}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
