import {DevtoolConfig} from "../devtool/type";

interface ObservableConstructor {
   new (input?: (subscriber: Subscriber) => void): any;
}

export type CacheConfigType = {
   isDevMode: boolean;
   paramsObjectIsPrior?: boolean;
   observableConstructor: ObservableConstructor;
   devtool?: DevtoolConfig;
};

export type ObservableFunc = (url: string) => {
   subscribe: (subscriber?: Partial<Subscriber>) => {
      unsubscribe(): void;
   };
};

export type Subscriber = {
   next: (value: any) => void;
   error: (err: any) => void;
   complete: () => void;
};

export type ObservableConfig = {
   url: string;
   observable: ObservableFunc;
   refresh?: boolean;
   clearTime?: number;
   params?: Record<string, string | number | boolean>;
};

export type UrlQueryOptions = {
   exact?: boolean;
   queryParams?: Record<string, string | number | boolean>;
};
