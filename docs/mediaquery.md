# Media Query

```tsx
import MediaQuery from '@root/plugin/mediaquery';

function MyApp(){
	init(this);
	MediaQuery("(max-width: 1024px)", (e) => {
		console.log("matches:", e)
	}, this)
}
```