## Rxjs Cache Service
A lightweight ( 18kb gZipped ), zero-dependency client-side package that
lets you cache rxjs GET responses before working with.

It significantly improves user experience in applications
where data does not change during a session or, the change frequency is low.

### Document Main Sections
-  <a href="#features"> Main Features </a>
-  <a href="#usage"> Usage Example </a>
-  <a href="#angular"> Usage in Angular </a>
-  <a href="#structure"> Cache Structure and Auto-Generated Keys </a>
-  <a href="#uid"> When to Use Unique Identifier </a>
-  <a href="#prefetch"> Prefetching </a>
-  <a href="#clean"> Cleaning the Data </a>
-  <a href="#reset"> Resetting the Cache </a>
-  <a href="#refresh"> How Refreshing Works with Subscribers </a>
-  <a href="#multiple-instances"> Multiple Instances </a>
-  <a href="#bulk"> Bulk Operations </a>
-  <a href="#null-ignore"> Null Values in Query Params </a>
-  <a href="#devtool"> Developer Tool </a>
-  <a href="#tables"> Available Methods & Parameters </a>

### <section id="features"> Main Features </section>
-  Globally available through the whole application
-  Improving user experience by increasing the data accessibility speed
-  Reducing network requests
-  Using stale data while refreshing
-  Prefetch easily
-  Clear timeout
-  <b>Integrated devtool</b> which lets you inspect the cache event history visually
-  Ease of use

### <section id="usage"> Usage Example </section>
Instantiate the cacheService in the root of your application or in any other place in the components tree.
```ts
const cacheService = new CacheService({
   isDevMode: process.env.MODE === "development",
   devtool: {
      show: true,
      isOpenInitially: true,
   },
});
```
See <a href="#config-params">Configuration Available Parameters<a/>

Provide it if you need and start using the service <code>get()</code> method as follow.

<b>Please Note</b> that you can use the <code>get()</code> method in 2 ways:
-  Using arrangedUrl
-  Ignoring arrangedUrl

<b>arrangedUrl</b> is part of the auto-generated key that the service uses to store the data. 
It's the combination of provided url, string query params (if exists in url param), defaultParams and params.
Alphabetically sorted, and empty strings and undefined and null values are removed
(removing null values can be configured).

For better understanding read the <a href="#structure"> Cache Structure and Auto-Generated Keys </a> section.

Method 1 ( Using arrangedUrl ):
```ts
function getPosts() {
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
function getPosts() {
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
Read the next section to see <b>when to use which</b> ?

<b>Important Hint:</b> Make sure you also provide the params (if exists) to the <code>get()</code> method.
This is because the service use all the query parameters to generate unique keys.

Also, for getting the best possible result of the service, always add your default params.
This will prevent of generating 2 different keys for <code>/posts</code> & <code>/posts?page=1</code> which we know
that they are exactly the same.

Read the <a href="#structure"> Cache Structure and Auto-Generated Keys </a> section for more details.

See <a href="#instance-params">Available Methods & Parameters<a/>

### <section id="methods"> When to Use Second Method </section>
The only situation that you need to use the second method, is when you need something that
is ignored in <code>arrangedUrl</code>.
In <code>arrangedUrl</code>, all the empty strings, undefined and null values
get removed (ignoring null values is configurable). Also duplicated query params get overwritten,
and you should join them with comma if you really need them.
If this behaviour doesn't satisfy you, consider the second method and work with your own data.

### <section id="angular"> Usage Example in Angular </section>
Hint: Make sure you have read the <a href="#usage"> Usage Example </a> section first.
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
function getPosts() {
   return this._cacheService.get<Post[]>({
      url: "posts",
      observable: ({arrangedUrl}) => this._httpClient.get<Post[]>(arrangedUrl),
      ...other_params,
   });
}
```

### <section id="structure"> Cache Structure and Auto-Generated Keys </section>
The cache is a map of auto-generated keys and the reshaped data by your possible operations (not the actual api response).
So a code snippet like this:
```ts
function getPosts() {
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
And if you pass <code>uniqueIdentifier</code> param as well:
```ts
function getPosts() {
   return cacheService.get<Post[]>({
      uniqueIdentifier: "tweaked_posts",
      url: "posts",
      ...other_params 
   });
}
```
The cache will ended up like this:
```ts
const cache = {
   "tweked_posts__posts? end-date=some_date & page=some_number & start-date=some_date": res_with_your_changes
}
````

<b>Please note</b> that the query parameters are sorted, undefined value is removed and the stored data
is the changed version.

<b>In most cases</b> you don't need to pass <code>uniqueIdentifier</code>.
Check the next section to see where you need to.

<b><code>arrangedUrl</code></b> which will be passed as on argument to your observable, is actually this auto-generated key
but <b>without</b> the unique identifier part.

### <section id="uid"> When to Use Unique Identifier </section>
As you can see in the previous section, the data stored in the cache is not always the raw version of the response.
This mey lead to <b>conflict</b> in some rare situations 
when you are working with the same API, but with different operations in different modules.

Imagine this situation that module A has called the API ("/posts") and the tweaked version
of the response is stored in the cache.
When module B calls the same API with different operations (because it needs a different version
of the data), if the <b>uniqueIdentifier</b> is NOT passed either in both modules,
the cache service generates the key and ends up with the exact same key, so it notify 
module B subscriber with the wrong data.

<b>To prevent these type of conflicts</b> you can use the <code>uniqueIdentifier</code>
parameter to distinguish between them.

### <section id="prefetch"> Prefetching </section>

Simply subscribe to your API handler and the result will be stored in the cache for later usages.
```ts
getPost().subscribe();
```

### <section id="clean"> Cleaning the Data </section>
The <code>clean()</code> method lets you remove a specific data or a collection.

<b>Hint: </b> if you used <code>uniqueIdentifier</code>, make sure to include it
in <code>clean()</code> method second parameter.

<b>Hint: </b>The default behaviour for query is NOT based on exact match.

#### Examples
Imagine that the cache is in this state:
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

<b>Please note</b> that in none of above examples the forth and fifth keys do not get removed
because <code>uniqueIdentifier</code> is not included in the options.

To clean all the keys containing "posts" & comments=true & uid=tweaked_posts (the fifth key):
```ts
cacheService.clean('posts',{ uniqueIdentifier: "tweaked_posts", queryParams: { comments: true} })
```

See <a href="#clean">Clean Method Available Parameters<a/>

### <section id="reset"> Resetting the Cache </section>
The <code>resetCache()</code> method will erase the entire stored data.

```ts
cacheService.resetCache();
```

### <section id="refresh"> How Refreshing Works with Subscribers </section>
If the data is not present in the cache, <code>subscriber.next()</code> and
<code>subscriber.complete()</code> will be called as soon as the request is resolves.

If the data is present in the cache, <code>subscriber.next()</code> will be immediately called
with the staled data, then it would be called with the fresh data once the request is resolved,
as well as <code>subscriber.complete()</code>.

### <section id="multiple-instances"> Multiple Instances </section>
Using multiple instances of the service is supported but the devtool should be used with one instance
at a time.

### <section id="bulk"> Bulk Operations </section>
Bulk operations like <code>forkJoin</code> are not supported in this version.

### <section id="null-ignore"> Null Values in Query Params </section>
Null values being ignored from query parameters by default. This behaviour can be changed in
cache configuration at instantiation.

See <a href="#config-params">Configuration Available Parameters<a/>

### <section id="devtool"> Developer Tool </section>
The integrated developer tool lets you inspect the cache last state and history of changes.
Also, every event related to the cache, will be logged into.

See <a href="#devtool-params">Devtool Available  Parameters<a/>

### <section id="tables"> Available Methods & Parameters </section>

#### <section id="config-params"> Configuration Parameters </section>

| Name                              | Type            | Description                                                                                                                                                                                                                                                                                                                |
|:----------------------------------|:----------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| isDevMode                         | boolean         | In dev mode, clear timeouts will be stored in local storage to be cleared in possible hot-reloads.This will make sure that the devtool will not show wrong information from previous loads in developer mode. Also, devtool is available only in dev mode.                                                                 |
| paramsObjectOverwrites-<br/>UrlQueries | boolean [=true] | Indicates how the service should behave if a query parameter is accidentally present in both <code>url</code> parameter as well as in <code>params</code> parameter.<br/>Example: cacheService.get({url: "/posts?page=2", params: {page: 3}}}, observable:() => observable) by default will be resolved to "/post?page=3". |
| ignoreNullValues                  | boolean [=true] | Indicates whether null values should be removed from query params.                                                                                                                                                                                                                                                         |
| devtool                           | object [:?]     | Developer tool configuration. See <a href="#devtool-params">Devtool Available  Parameters<a/>.                                                                                                                                                                                                                             |
&nbsp;

#### <section id="instance-params"> Service Instance Methods & Parameters </section>

| Name    | Type     | Description                                                    |
|:--------|:---------|:---------------------------------------------------------------|
| get()   | function | To fetching data and storing the expected result in the cache. |
| clean() | function | To clean or a collection data.                                 |
| reset() | function | To reset the entire cache.                                     |
| config   | object   | Configuration passed to the service.                           |
| cachedData   | object   | The stored data.                                               |
| observables | object   | The stored observable.                                         |
| clearTimeouts | object   | The active clear timeouts.                                     |
&nbsp;

#### <section id="get-params"> Get Method Parameters </section>

| Name             | Type             | Description                                                                                                               |
|:-----------------|:-----------------|:--------------------------------------------------------------------------------------------------------------------------|
| url              | string           | The api address (may include query params or not)                                                                         |
| observable       | () => function   | The callback function which returns an observable.<br/> It receives an object containing the  arrangedUrl as input.       |
| uniqueIdentifier | string [:?]      | Will be added to the auto-generated key for storing the data.<br/>See <a href="#uid"> When to Use Unique Identifier </a>. |
| defaultParams    | object [:?]      | Default query params (add to get the best result).                                                                        |
| params           | object [:?]      | Query parameters.                                                                                                         |
| refresh          | boolean [=false] | Indicated if the data should be refreshed on next calls or not.                                                           |
| clearTimeout     | number [?:]      | The time in milliseconds which be used to remove the data from the cache.                                                 |
&nbsp;

#### <section id="clean-params"> Clean Method Parameters </section>

| Name                     | Type         | Description                                                                                                                       |
|:-------------------------|:-------------|:----------------------------------------------------------------------------------------------------------------------------------|
| url                      | string       | May or may not include query strings.<br/>Do NOT include <code>uniqueIdentifier</code> part here.                                 |
| options                  | object [?:]  | Extra options for cleaning.                                                                                                       |
| options.uniqueIdentifier | string [?:]  | Unique identifier (if the key includes unique identifier, you should pass it here if even the query is not based on exact match). |
| options.exact            | boolean [?:] | Indicates if the query should be based on exact match.                                                                            |
| options.queryParams      | object [?:]  | Query Parameters (will be sorted and truncated if contains empty string and undefined).                                           |

See <a href="clean"> Cleaning the data </a> for examples.
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
