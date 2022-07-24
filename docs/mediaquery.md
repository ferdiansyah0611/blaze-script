# Media Query

Plugin for media query, listening every change.

```tsx
import MediaQuery from '@root/plugin/mediaquery';

function MyApp(){
	init(this);
	MediaQuery("(max-width: 1024px)", (matches) => {
		this.state.isMobile = matches;
	}, this)
}
```