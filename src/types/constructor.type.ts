import {DevtoolConfig} from "../devtool/type";

export type CacheConfigType = {
   isDevMode: boolean;
   paramsObjectOverwritesUrlQueries?: boolean;
   removeNullValues?: boolean;
   preventSecondCallIfDataIsUnchanged?: boolean;
   devtool?: DevtoolConfig;
};
