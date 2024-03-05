import {QueryParams} from "./query-params.type";

export type UpdateCallback<T> = (oldData: T) => T;

export type KeySelector = {
   uniqueIdentifier?: string;
   url: string;
   exact?: boolean;
   params?: QueryParams;
   arrayFieldName?: string;
   // todo: add generic type
   resolver?: (params: {oldData: any; updatedEntity: any}) => any;
};

export type UpdateParams<T> = {
   uniqueIdentifier?: string;
   url: string;
   params?: QueryParams;
   data: T | UpdateCallback<T>;
   updateRelatedKeys?: {
      entityUniqueField: string;
      keysSelector: KeySelector;
   };
};
