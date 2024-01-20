## <section id="beginning"> RxJS Cache Service </section>
RxJS cache response is a lightweight, zero-dependencies, client-side package,
designed to improve user experience in applications where data remains static
or changes infrequently during user browsing.

By caching responses from RxJS GET method calls, this package ensures users won't hit
unnecessary delays. When stale data is available, users will see it immediately, cutting down
wait times and creating a seamless browsing experience.

#### Check the <a href="https://rxjs-cache-service-live-demo.vercel.app/"><u>Live Demo</u></a>

### <section id="features"> Main Features </section>
- Global accessibility throughout the application.
- Accelerates data access.
- Reduces network requests.
- Uses stale data during refresh.
- Simplifies prefetching.
- Includes clear timeouts for precise caching control.
- Integrated DevTool for visual cache event inspection.
- Designed for easy use.

### Document Main Sections
-  <a href="#features"> Main Features </a>
-  <a href="#usage"> Usage Examples </a>
-  <a href="#angular"> Usage in Angular </a>
-  <a href="#structure"> Cache Structure and Auto-Generated Keys </a>
-  <a href="#uid"> Determining When to Use a Unique Identifier </a>
-  <a href="#prefetch"> Prefetching </a>
-  <a href="#clean"> Cleaning the Data </a>
-  <a href="#reset"> Resetting the Cache </a>
-  <a href="#refresh"> How Refreshing Works with RxJS Subscribers </a>
-  <a href="#multiple-instances"> Multiple Instances </a>
-  <a href="#bulk"> Bulk Operations </a>
-  <a href="#null-ignore"> Null Values in Query Params </a>
-  <a href="#devtool"> Developer Tool </a>
-  <a href="#tables"> API Reference </a>


### <section id="usage"> Usage Examples </section>
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
const cacheService = new CacheService({
   isDevMode: process.env.MODE === "development",
   devtool: {
      show: true,
   },
});
```
See <a href="#config-params">Configuration Available Parameters</a>

Supply it as needed and start using it as follows:

<b>Please Note</b> that you can use the `get()` method in 2 ways:
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
   return cacheService.get<Post[]>({
      url: "posts",
      defaultParams: {page: 1, "page-size": 20},
      params: urlParamsObject,
      observable: ({arrangedUrl}) => rxjs_observable<Post[]>(arrangedUrl).pipe(your_operations),
   });
}
```

Method 2 ( Ignoring arrangedUrl argument and working with your own data ):
```ts
const getPosts = () => {
   const url = "posts";
   const params = urlParamsObject;
   return cacheService.get<Post[]>({
      url: url,
      defaultParams: {page: 1, "page-size": 20},
      params: params,
      observable: () => rxjs_observable<Post[]>(url, {params}).pipe(your_operations),
   });
}
```
Read the following section to understand <b>when to use each method</b>?

<b>Important Hint:</b>  Ensure that you also provide the parameters (if they exist) 
to the get() method. This is essential as the service uses all query parameters to generate unique keys.

Additionally, to achieve the best possible results from the service, always include your
API default parameters when they can be altered by the end-user. This prevents the generation
of two different keys for /posts and /posts?page=1, even though they are essentially the same.

Read the <a href="#structure"> Cache Structure and Auto-Generated Keys </a> section for more details.

See <a href="#get-params">Get Method Available Parameters</a>

### <section id="methods"> Determining When to Use Second Method </section>
You may opt for the second method only when there's a specific requirement that is ignored
in arrangedUrl. In arrangedUrl, all empty strings, undefined, and null values are automatically
removed (ignoring null values can be configured). Additionally, duplicated query parameters
are overwritten, and you should concatenate them with commas if you genuinely need all of them.
If this behavior doesn't meet your needs, consider using the second method and work with your own data.

### <section id="angular"> Usage Example in Angular </section>
Hint: Ensure you have read the <a href="#usage"> Usage Example </a> section first.
```ts
function cacheServiceFactory() {
   return new CacheService({
      isDevMode: isDevMode(),
      devtool: your_desired_options,
   });
}

@NgModule({
   providers: [
      {provide: CacheService, useFactory: cacheServiceFactory},
   ],
})
```

And start using it in your services:
```ts
const getPosts = () => {
   return this._cacheService.get<Post[]>({
      url: "posts",
      observable: ({arrangedUrl}) => this._httpClient.get<Post[]>(arrangedUrl),
      ...other_params,
   });
}
```

### <section id="structure"> Cache Structure and Auto-Generated Keys </section>
The cache is a map of auto-generated keys and the data reshaped by your potential
operations (not the actual API response). For example, a code snippet like this:
```ts
const getPosts = () => {
   return cacheService.get<Post[]>({
      url: "posts",
      defaultParams: {page: 1 },
      params: {
         page: url.query.page, 
         "start-date": some_date, 
         "end-date": some_date,
         "some-other-param": is_undefined_for_now 
      },
      observable: ({arrangedUrl}) => rxjs_observable<Post[]>(arrangedUrl)
         .pipe(map((res) => res_with_some_changes )),
   });
}
```
Will update the cache to this:
```ts
const cache = {
   "posts? end-date=some_date & page=some_number & start-date=some_date": res_with_your_changes
}
```
If you also pass the uniqueIdentifier parameter:
```ts
const getPosts = () => {
   return cacheService.get<Post[]>({
      uniqueIdentifier: "tweaked_posts",
      url: "posts",
      ...other_params 
   });
}
```
The cache will end up like this:
```ts
const cache = {
   "tweked_posts__posts? end-date=some_date & page=some_number & start-date=some_date": res_with_your_changes
}
````

<b>Please note</b> that the query parameters are sorted, undefined value is removed and the stored data
is the changed version.

<b>In most cases</b> you don't need to pass `uniqueIdentifier`.
Refer to the next section to understand when it's necessary.

<b>`arrangedUrl`</b> passed as an argument to your observable is essentially this auto-generated key
but <b>without</b> the unique identifier part.

### <section id="uid"> Determining When to Use a Unique Identifier </section>
As you can see in the previous section, the data stored in the cache is not always the raw version
of the response. This <b>will lead to conflicts</b> in some rare situations when you are working
with the same API but with different operations in different modules.


Imagine a situation where module A has called the API ("/posts"), and the tweaked version of the
response is stored in the cache. When module B calls the same API with different operations
(as it needs a distinct version of the data), if the `uniqueIdentifier` is NOT passed
in both modules, the cache service generates the key, resulting in the exact same key.
Consequently, it notifies the module B subscriber with incorrect data.

<b>To prevent these types of conflicts</b> you can use the `uniqueIdentifier`
parameter to distinguish between them.

### <section id="prefetch"> Prefetching </section>
Simply subscribe to your API handler, and the result will be stored in the cache for later use.
```ts
getPost().subscribe();
```

### <section id="clean"> Cleaning the Data </section>
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
    "tweaked_posts__posts?page=1&comments=true" : tweakedData,
}
```

To clean all the keys containing "posts" & page=1 (matches the 2 first keys):
```ts
cacheService.clean('posts',{ queryParams: { page: 1} })
```

To clean one key, containing "posts" & page=1 (exact match):
```ts
cacheService.clean('posts',{ queryParams: { page: 1}, exact: true })
```

<b>Please note</b> that neither of the above examples removes
the fourth and fifth keys because uniqueIdentifier is not included in the options.

To clean all the keys containing "posts" & comments=true & uid=tweaked_posts (matches only the fifth key):
```ts
cacheService.clean('posts',{ uniqueIdentifier: "tweaked_posts", queryParams: { comments: true} })
```

See <a href="#clean-params">Clean Method Available Parameters</a>

### <section id="reset"> Resetting the Cache </section>
The `resetCache()` method clears the entire cache.

```ts
cacheService.resetCache();
```

### <section id="refresh"> How Refreshing Works with RxJS Subscribers </section>
If the data is not in the cache, subscriber.next() and subscriber.complete() are triggered
when the request is resolved.

If the data is already in the cache, subscriber.next() is immediately invoked
with the stale data. Once the request is resolved, it's called again with the fresh data,
and subscriber.complete() is also triggered.

### <section id="multiple-instances"> Multiple Instances </section>
Using multiple instances of the service is supported, but the devtool
should be used with one instance at a time.

### <section id="bulk"> Bulk Operations </section>
Bulk operations, such as forkJoin, are not supported in this version.

### <section id="null-ignore"> Null Values in Query Params </section>
Null values are ignored from query parameters by default. This behavior can be changed
in the cache configuration at instantiation.

See <a href="#config-params">Configuration Available Parameters</a>

### <section id="devtool"> Developer Tool </section>
The integrated developer tool allows you to inspect the last state
of the cache and its history of changes. Additionally, every event
related to the cache will be logged in the tool.

See <a href="#devtool-params">Devtool Available  Parameters</a>

### <section id="tables"> API Reference </section>

#### <section id="config-params"> Configuration Parameters </section>

| Name                              | Type            | Description                                                                                                                                                                                                                                                                                               |
|:----------------------------------|:----------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| isDevMode                         | boolean         | In dev mode, clear timeout IDs will be stored in local storage to be cleared in possible hot-reloads. This ensures that the devtool does not display incorrect information from previous loads during development.<br/><b>Additionally</b>, the devtool is available only in dev mode.                    |
| paramsObjectOverwrites-<br/>UrlQueries | boolean [=true] | Determines how the service should behave if a query parameter is accidentally present in both the url parameter and the params parameter.<br/><b>Example</b>: `cacheService.get({url: "/posts?page=2", params: {page: 3}, observable:() => observable})` by default will be resolved to `"/post?page=3"`. |
| removeNullValues                  | boolean [=true] | Determines whether null values should be removed from query parameters or not.                                                                                                                                                                                                                            |
| devtool                           | object [:?]     | Developer tool configuration. See <a href="#devtool-params">Devtool Available  Parameters</a>.                                                                                                                                                                                                            |

<br></br>

#### <section id="instance-params"> Service Instance Methods & Properties </section>

| Name    | Type     | Description                                                            |
|:--------|:---------|:-----------------------------------------------------------------------|
| get()   | function | Fetches data and stores the expected result in the cache.              |
| clean() | function | Allows you to remove specific data or multiple entries from the cache. |
| reset() | function | Clears the entire cache.                                            |
| config   | object   | Configuration passed to the service.                                   |
| cachedData   | object   | Stored data.                                                           |
| observables | object   | Stored observables.                                                    |
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
