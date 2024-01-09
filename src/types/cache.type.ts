import {DevtoolConfig} from "../devtool/type";

interface ObservableConstructor {
   new (input?: (subscriber: Subscriber) => void): any;
}

export type CacheConfigType = {
   isDevMode: boolean;
   paramsObjectOverwritesUrlQueries?: boolean;
   observableConstructor: ObservableConstructor;
   devtool?: DevtoolConfig;
};

export type ObservableFunc = (url: string) => {
   subscribe: (subscriber: PartialObserver<any>) => {
      unsubscribe(): void;
   };
};

interface NextObserver<T> {
   closed?: boolean;
   next: (value: T) => void;
   error?: (err: any) => void;
   complete?: () => void;
}

interface ErrorObserver<T> {
   closed?: boolean;
   next?: (value: T) => void;
   error: (err: any) => void;
   complete?: () => void;
}

interface CompletionObserver<T> {
   closed?: boolean;
   next?: (value: T) => void;
   error?: (err: any) => void;
   complete: () => void;
}

type PartialObserver<T> = NextObserver<T> | ErrorObserver<T> | CompletionObserver<T>;

export type Subscriber = {
   next: (value: any) => void;
   error: (err: any) => void;
   complete: () => void;
};

export type ObservableConfig = {
   uniqueIdentifier?: string;
   url: string;
   observable: ObservableFunc;
   refresh?: boolean;
   clearTime?: number;
   params?: Record<string, string | number | boolean>;
   defaultParams?: Record<string, string | number | boolean>;
};

export type CleanQueryOptions = {
   uniqueIdentifier?: string;
   exact?: boolean;
   queryParams?: Record<string, string | number | boolean>;
};
