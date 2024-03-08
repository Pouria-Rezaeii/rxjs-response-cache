import {QueryParams} from "./index.type";

export type GenericObservable<T> = {
   subscribe: (subscriber: PartialObserver<T>) => {
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

export type ObservableConfig<T> = {
   uniqueIdentifier?: string;
   url: string;
   observable: (params: {arrangedUrl: string}) => GenericObservable<T>;
   refresh?: boolean;
   clearTimeout?: number;
   params?: QueryParams;
   defaultParams?: QueryParams;
};
