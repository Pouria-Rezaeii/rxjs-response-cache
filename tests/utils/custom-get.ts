import {lastValueFrom, firstValueFrom} from "rxjs";
import {ObservableConfig} from "../../src/types/get.type";
import {observableFunction} from "./observable-function";
import ResponseCache from "../../src";

export function getLastFactory(cache: ResponseCache) {
   return function (params: {url: string} & Partial<ObservableConfig<any>>) {
      const defaultObservable = ({arrangedUrl}: any) => observableFunction(arrangedUrl);

      return lastValueFrom(
         cache.get({
            ...params,
            observable: params.observable || defaultObservable,
         })
      );
   };
}

export function getFirstFactory(cache: ResponseCache) {
   return function (params: {url: string} & Partial<ObservableConfig<any>>) {
      const defaultObservable = ({arrangedUrl}: any) => observableFunction(arrangedUrl);

      return firstValueFrom(
         cache.get({
            ...params,
            observable: params.observable || defaultObservable,
         })
      );
   };
}
