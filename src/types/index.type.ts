import {CacheConfigType} from "./constructor.type";
import {RearrangeUrlInput} from "../utils/rearrange-url";
import {GenericObservable} from "./get.type";

export * from "./constructor.type";
export * from "./get.type";
export * from "./remove.type";
export * from "./insert.type";
export * from "./update.type";

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export type HandlerAssets = {
   cachedData: Map<string, any>;
   observables: Map<string, (params: {arrangedUrl: string}) => GenericObservable<any>>;
   clearTimeouts: Map<string, number>;
   showDevtool: boolean;
   config: CacheConfigType;
   isDev: boolean;
   rearrangeUrl: (params: Pick<RearrangeUrlInput, "url" | "params" | "defaultParams">) => string;
   updateDevtool: (url: string, status: string, data: any) => void;
   setClearTimeout: (key: string, timeout: number, data: any) => void;
   getRemovalTimeoutMessage: (timeout: number) => string;
};
