import {RemoveQueryOptions} from "../../types/remove.type";
import {getMatchedKeys} from "../../utils/get-matched-keys";
import {HandlerAssets} from "../../types/index.type";

export function remove(assets: HandlerAssets, url: string, options?: RemoveQueryOptions) {
   const {updateDevtool, showDevtool, config, observables, clearTimeouts, cachedData} = assets;
   const matches = getMatchedKeys({
      source: cachedData,
      url,
      // this is because options.queryParams is deprecated
      options: {...options, params: options?.params || options?.queryParams},
      paramsObjectOverwrites: config.paramsObjectOverwritesUrlQueries!,
      removeNullValues: config.removeNullValues!,
   });
   matches.forEach((url, index) => {
      cachedData.delete(url);
      observables.delete(url);
      clearTimeout(clearTimeouts.get(url));
      clearTimeouts.delete(url);
      showDevtool &&
         updateDevtool(url, `🗑 Matched and removed (${index + 1}/${matches.length})`, {
            url,
            cleanQueryOptions: options || {},
         });
   });
}
