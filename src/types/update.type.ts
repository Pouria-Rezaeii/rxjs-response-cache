import {QueryParams} from "./query-params.type";

export type UpdateCallback<T> = (oldData: T) => T;

export type KeySelector = {
   uniqueIdentifier?: string;
   url: string;
   exact?: boolean;
   params?: QueryParams;
};

export type UpdateParams<T> = {
   uniqueIdentifier?: string;
   url: string;
   params?: QueryParams;
   data: T | UpdateCallback<T>;
   // updateRelatedKeys?: {
   //    entityUniqueField: {
   //       [key: string]: string | number;
   //    };
   //    keysSelector: KeySelector | KeySelector[];
   // };
};
