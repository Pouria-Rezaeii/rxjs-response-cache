import {DevtoolConfig} from "../devtool/type";
import {Observable} from "rxjs";

export type CacheConfigType = {
   isDevMode: boolean;
   paramsObjectOverwritesUrlQueries?: boolean;
   devtool?: DevtoolConfig;
};

export type ObservableConfig<T> = {
   uniqueIdentifier?: string;
   url: string;
   observable: (url: string) => Observable<T>;
   refresh?: boolean;
   clearTimeout?: number;
   params?: Record<string, string | number | boolean>;
   defaultParams?: Record<string, string | number | boolean>;
};

export type CleanQueryOptions = {
   uniqueIdentifier?: string;
   exact?: boolean;
   queryParams?: Record<string, string | number | boolean>;
};
