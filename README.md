## <section id="beginning"> RxJS Response Cache </section>
RxJS Response Cache is a lightweight, zero-dependencies, client-side package,
designed to improve user experience in applications where data remains static
or changes infrequently during user browsing.

By caching responses fetched by RxJS Observables, this package ensures users won't hit
unnecessary delays. When stale data is available, users will see it immediately, cutting down
wait times and creating a seamless browsing experience.

#### Check the <a href="https://rxjs-response-cache-live-demo.vercel.app/">Live Demo</a>

## <section id="features"> Main Features </section>
- Global accessibility throughout the application.
- Uses stale data during refresh.
- Accelerates data access.
- Reduces network requests.
- Simplifies prefetching.
- Includes clear timeouts for precise caching control.
- Integrated DevTool for visual cache event inspection.
- Designed for easy use.

## Document Main Sections
-  <a href="#features"> Main Features </a>
-  <a href="#usage"> Usage Examples </a>
-  <a href="#angular"> Usage in Angular </a>
-  <a href="#structure"> Cache Structure and Auto-Generated Keys </a>
-  <a href="#uid"> Determining When to Use a Unique Identifier </a>
-  <a href="#prefetch"> Prefetching </a>
-  <a href="#clean"> Cleaning the Data </a>
-  <a href="#reset"> Resetting the Cache </a>
-  <a href="#update"> Updating the Cache </a>
-  <a href="#refresh"> How Refreshing Works with RxJS Subscribers </a>
-  <a href="#multiple-instances"> Multiple Instances </a>
-  <a href="#bulk"> Bulk Operations </a>
-  <a href="#null-ignore"> Null Values in Query Params </a>
-  <a href="#devtool"> Developer Tool </a>
-  <a href="#tables"> API Reference </a>


## <section id="usage"> Usage Examples </section>
Install the package:

```shell
npm install rxjs-cache-service --save
```
or
```shell
yarn add rxjs-cache-service
```


Instantiate the cache service at the root of your application or any other location within the components tree.
```ts
import Cache from 'rxjs-response-cache';

const cache = new Cache({
   isDevMode: process.env.MODE === "development",
   devtool: {
      show: true,
   },
});
```
See <a href="#config-params">Configuration Available Parameters</a>

Supply it as needed and start using it as follows:

<b>Please Note</b> that you can use the `get()` method (which returns a new observable) in 2 ways:
-  Using arrangedUrl
-  Ignoring arrangedUrl

<b>arrangedUrl</b> is a part of the auto-generated key used by the service to store data.
It's a combination of provided `url`, string query parameters (if they exist in url parameter),
`defaultParams` and `params`.
The values are alphabetically sorted, and empty strings, undefined, and null values are
automatically removed (null value removal can be configured).

For a deeper understanding, refer to the <a href="#structure"> Cache Structure and Auto-Generated Keys </a> section.

Method 1 ( Using arrangedUrl ):
```ts
const getPosts = () => {
   return cache.get<Post[]>({
      url: "posts",
      defaultParams: {page: 1, "page-size": 20},
      params: urlParamsObject,
      observable: ({arrangedUrl}) => observable<Post[]>(arrangedUrl),
   }).pipe(your_operations);
}
```

Method 2 ( Ignoring arrangedUrl argument and working with your own data ):
```ts
const getPosts = () => {
   const url = "posts";
   const params = urlParamsObject;
   return cache.get<Post[]>({
      url: url,
      defaultParams: {page: 1, "page-size": 20},
      params: params,
      observable: () => observable<Post[]>(url, {params}),
   }).pipe(your_operations);
}
```
Read the following section to understand <b>when to use each method</b>?

<b>Best practice:</b> Chain the `pipe()`s to the `get()` method, not the passed observable.
This ensures that the actual API response, not a potentially modified version, is stored in the cache,
and prevents potential bugs when working with the same API but different operations in separate modules.

<b>Important Hint:</b>  Ensure that you also provide the parameters (if they exist) 
to the get() method. This is essential as the service uses all query parameters to generate unique keys.

Additionally, to achieve the best possible results from the service, always include your
API default parameters when they can be altered by the end-user. This prevents the generation
of two different keys for /posts and /posts?page=1, even though they are essentially the same.

Read the <a href="#structure"> Cache Structure and Auto-Generated Keys </a> section for more details.

See <a href="#get-params">Get Method Available Parameters</a>

And then:
```ts
getPost().subscribe();
```

## <section id="methods"> Determining When to Use Second Method </section>
You may opt for the second method only when there's a specific requirement that is ignored
in arrangedUrl. In arrangedUrl, all empty strings, undefined, and null values are automatically
removed (ignoring null values can be configured). Additionally, duplicated query parameters
are overwritten, and you should concatenate them with commas if you genuinely need all of them.
If this behavior doesn't meet your needs, consider using the second method and work with your own data.

## <section id="angular"> Usage Example in Angular </section>
Hint: Ensure you have read the <a href="#usage"> Usage Example </a> section first.
```ts
import Cache from 'rxjs-response-cache';

function cacheFactory() {
   return new Cache({
      isDevMode: isDevMode(),
      devtool: your_desired_options,
   });
}

@NgModule({
   providers: [
      {provide: Cache, useFactory: cacheFactory},
   ],
})
```

And start using it in your services:
```ts
getPosts = () => {
   return this._cache.get<Post[]>({
      url: "posts",
      observable: ({arrangedUrl}) => this._httpClient.get<Post[]>(arrangedUrl),
      ...other_params,
   });
}
```

And then in your components:
```ts
getPost().subscribe();
```


## <section id="structure"> Cache Structure and Auto-Generated Keys </section>
The cache is a map of auto-generated keys and the data. For example, a code snippet like this:
```ts
const getPosts = () => {
   return cache.get<Post[]>({
      url: "posts",
      defaultParams: {page: 1 },
      params: {
         page: url.query.page, 
         "start-date": some_date, 
         "end-date": some_date,
         "some-other-param": is_undefined_for_now 
      },
      observable: ({arrangedUrl}) => observable<Post[]>(arrangedUrl),
   }).pipe(your_operations);
}
```

Will update the cache to this:
```ts
const cache = {
   "posts? end-date=some_date & page=some_number & start-date=some_date": res
}
```
<b>Please note</b> that the query parameters are sorted and undefined value is removed. 

`arrangedUrl` passed as an argument to your observable is essentially this auto-generated key.

<b>Best practice:</b> Chain the `pipe()`s to the `get()` method, not the passed observable.
This ensures that the actual API response, not a potentially modified version, is stored in the cache,
and prevents potential bugs when working with the same API but different operations in separate modules.

## <section id="uid"> Determining When to Use a Unique Identifier </section>
This value, if present, will be added to the auto-generated key for storing the data.
In most cases (99.99%), it's unnecessary. Consider using it only if you must differentiate
between two data types which are going to generate the exact same key.

## <section id="prefetch"> Prefetching </section>
Simply subscribe to your API handler, and the result will be stored in the cache for later use.
```ts
getPost().subscribe();
```

## <section id="clean"> Cleaning the Data </section>
The clean() method allows you to remove specific data or multiple entries from the cache.

<b>Hint: </b> if you used `uniqueIdentifier`, make sure to include it in the second parameter.

<b>Note: </b>The default behavior for queries is NOT based on an exact match.

#### Examples
Picture the cache in this state:
```ts
const cache = {
    "posts?page=1" : data,
    "posts?page=1&comments=true" : data,
    "posts?page=2": data,
    "tweaked_posts__posts?page=1" : tweakedData,
}
```

To clean all the keys containing "posts" & page=1 (matches the 2 first keys):
```ts
cache.clean('posts',{ queryParams: { page: 1} })
```

To clean one key, containing "posts" & page=1 (exact match):
```ts
cache.clean('posts',{ queryParams: { page: 1}, exact: true })
```

<b>Please note</b> that neither of the above examples removes
the fourth and fifth keys because uniqueIdentifier is not included in the options.

To clean all the keys containing "posts" & uid=tweaked_posts (matches only the forth key):
```ts
cache.clean('posts',{ uniqueIdentifier: "tweaked_posts", queryParams: { comments: true} })
```

See <a href="#clean-params">Clean Method Available Parameters</a>

## <section id="reset"> Resetting the Cache </section>
The `reset()` method clears the entire cache.
```ts
cache.reset();
```

## <section id="update"> Updating the Cache </section>
<b>Coming Soon:</b> Update functionality is slated for the next minor version release!


## <section id="refresh"> How Refreshing Works with RxJS Subscribers </section>
If the data is not present in the cache, `subscriber.next()` and `subscriber.complete()` are triggered
when the request is resolved.

If the data is already present in the cache, `subscriber.next()` is immediately triggered with the stale data.
By default, once the request is resolved, the newly fetched data is compared to the stale data. If they differ,
`subscriber.next()` is invoked again with the fresh data, and ultimately, `subscriber.complete()` is triggered.

This equality check can be disabled in the configuration, causing `subscriber.next()` to be called twice,
even if the data is identical to the cached version.

<b>Please note</b> that you should stop rendering spinners and skeletons into the `next()` function not the `complete()`,
when using the refresh feature.

## <section id="multiple-instances"> Multiple Instances </section>
Using multiple instances of the service is supported, but the devtool
should be used with one instance at a time.

## <section id="bulk"> Bulk Operations </section>
The `get()` method returns a new observable, so use it with bulk operations as usual.
Example:
```ts
const res = forkJoin({ foo: cache.get(), bar: cache.get() })
```

## <section id="null-ignore"> Null Values in Query Params </section>
Null values are ignored from query parameters by default. This behavior can be changed
in the cache configuration at instantiation.

See <a href="#config-params"> Configuration Available Parameters </a>

## <section id="devtool"> Developer Tool </section>
The integrated developer tool allows you to inspect the last state
of the cache and its history of changes. Additionally, every event
related to the cache will be logged in the tool.

See <a href="#devtool-params"> Devtool Available  Parameters </a>

## <section id="tables"> API Reference </section>

#### <section id="config-params"> Configuration Parameters </section>

| Name                              | Type            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|:----------------------------------|:----------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| isDevMode                         | boolean         | In dev mode, clear timeout IDs will be stored in local storage to be cleared in possible hot-reloads. This ensures that the devtool does not display incorrect information from previous loads during development.<br/><b>Additionally</b>, the devtool is available only in dev mode.                                                                                                                                                                                                           |
| paramsObjectOverwrites-<br/>UrlQueries | boolean [=true] | Determines how the service should behave if a query parameter is accidentally present in both the url parameter and the params parameter.<br/><b>Example</b>: `cache.get({url: "/posts?page=2", params: {page: 3}, observable:() => observable})` by default will be resolved to `"/post?page=3"`.                                                                                                                                                                                        |
| preventSecondCall<br/>IfDataIsUnchanged | boolean [=true] | Determines whether the `observable.next()` should be invoked again when the refreshed data is identical to the stale data.<br/><b>By default</b>, the `observable.next()` is invoked only once in such cases, optimizing to prevent unnecessary rerenders in applications.<br/>If desired, you can pass `false` and perform your own check within your application.<br/>For a detailed explanation, please refer to the <a href="#refresh">How Refreshing Works with RxJS Subscribers</a> section. |
| removeNullValues                  | boolean [=true] | Determines whether null values should be removed from query parameters or not.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| devtool                           | object [:?]     | Developer tool configuration. See <a href="#devtool-params">Devtool Available  Parameters</a>.                                                                                                                                                                                                                                                                                                                                                                                                   |

<br></br>

#### <section id="instance-params"> Service Instance Methods & Properties </section>

| Name          | Type     | Description                                                            |
|:--------------|:---------|:-----------------------------------------------------------------------|
| get()         | function | Fetches data and stores the expected result in the cache.              |
| clean()       | function | Allows you to remove specific data or multiple entries from the cache. |
| reset()       | function | Clears the entire cache.                                            |
| config        | object   | Configuration passed to the service.                                   |
| data          | object   | Stored data.                                                           |
| observables   | object   | Stored observables.                                                    |
| clearTimeouts | object   | Active clear timeouts.                                                 |

<br></br>

#### <section id="get-params"> Get Method Parameters </section>

| Name             | Type             | Description                                                                                                                                                                                                                                                                                                                                                                                        |
|:-----------------|:-----------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| url              | string           | The endpoint address (may include query parameters or not).                                                                                                                                                                                                                                                                                                                                        |
| observable       | () => function   | The callback function that returns an observable. It receives an object containing the `arrangedUrl` as input.<br/>See <a href="#structure"> Cache Structure and Auto-Generated Keys </a> for details.                                                                                                                                                                                             |
| uniqueIdentifier | string [:?]      | This value, if present, will be added to the auto-generated key for storing the data.<br/>See <a href="#uid"> When to Use Unique Identifier </a>.                                                                                                                                                                                                                                                  |
| defaultParams    | object [:?]      | The API's default query parameters.<br/>To optimize cache results, ensure to include them if they can be altered by the end-user.                                                                                                                                                                                                                                                                  |
| params           | object [:?]      | The queryParams will overwrite the defaultParams, and by default (configurable), any query strings in the url parameter will also be overwritten.                                                                                                                                                                                                                                                  |
| refresh          | boolean [=false] | Determines if the data should be refreshed on the next calls or noDetermines if the data should refresh on subsequent calls.<br/>By default, the API will be called only <b>once</b>.<br/>Passing `true` is especially useful when you are unsure if the data will remain the same. This way, users receive the old data immediately and then see the newly fetched data if there are any changes. |
| clearTimeout     | number [?:]      | The time in milliseconds used to remove the data from the cache.                                                                                                                                                                                                                                                                                                                                   |

<br></br>

#### <section id="clean-params"> Clean Method Parameters </section>

| Name                     | Type         | Description                                                                                                                                        |
|:-------------------------|:-------------|:---------------------------------------------------------------------------------------------------------------------------------------------------|
| url                      | string       | The endpoint address (may include query parameters or not).<br/><b>DO NOT</b> include the `uniqueIdentifier` part here.                            |
| options                  | object [?:]  | Extra options for cleaning.                                                                                                                        |
| options.exact            | boolean [?:] | Determines if the query should be based on an exact match or not.                                                                                  |
| options.uniqueIdentifier | string [?:]  | Unique identifier.<br/><b>Note</b>: If the key includes a unique identifier, you should pass it here, even if the query is not based on an exact match. |
| options.queryParams      | object [?:]  | Query Parameters. They will be sorted and truncated if they contain an empty string, undefined, or null (null is configurable).                             |

See <a href="#clean"> Cleaning the data </a> for examples.
<br></br>


#### <section id="devtool-params"> Devtool Parameters </section>
```ts
type DevtoolConfig = {
   show?: boolean; // default = isDevMode && true
   isOpenInitially?: boolean; // default = false
   styles?: {
      zIndex?: number; // default = 5000 
      toggleButtonPosition?: {
         right?: number; // default = 25
         bottom?: number; // default = 25
      };
   };
}
```
