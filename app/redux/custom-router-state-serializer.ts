import { RouterStateSerializer } from '@ngrx/router-store';
import { Params, RouterStateSnapshot } from '@angular/router';
import { IUCAppState } from './uc.app-state';
import { query } from '@angular/core/src/animation/dsl';

export interface RouterStateUrl {
    url: string;
    queryParams: Params;
}

export class CustomRouterStateSerializer implements RouterStateSerializer<RouterStateUrl> {
    serialize(routerState: RouterStateSnapshot): RouterStateUrl {
        let { url } = routerState;
        const queryParams = {};
        let route = routerState.root;

        while (route.firstChild) {
            route = route.firstChild;
        }
        if (url.startsWith('/')) {
            url = url.substr(1);
        }
        if (url.startsWith('#')) {
            url = url.substr(1);
        }

        for (const u of url.split('&')) {
            const regex = /(.+)=(.*)/.exec(u);
            queryParams[regex[1]] = regex[2];
        }

        return { url, queryParams };
    }

}
