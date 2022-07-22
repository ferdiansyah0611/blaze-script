# Query

Caching request with indexedDb and save expired on localStorage

## Example

```tsx
import query from "@root/plugin/query";

// ...
const date = new Date()
date.setMilliseconds("+2000")
query('https://newsapi.org/v2/everything?q=tesla&from=2022-06-22&sortBy=publishedAt&apiKey=00000000', {
	// name table
	as: 'mydata',
	// how long cache the data
	expired: date.getTime(),
	// index
	table: 'title,url,source,description,author,urlToImage',
	// if response a object, select the object where type is array
	select: 'articles',
	// function for request, default fetch()
	with: '',
	// option on request, example fetch(url, option)
	option: {},
	// handling the result data
	handle: (result) => {
		this.state.list = result
		console.log(result)
	}
});
```