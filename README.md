<div align="center">

# Blaze Script

Framework Single Page Application

</div>

## Feature

-   Virtual DOM
-   State Management
-   Lifecycle
-   Include Router and Context
-   JSX Syntax
-   Batch
-   Build Faster

## Get Started

```tsx
import App, { init } from "@blaze";

const Hello = function () {
    const { render } = init(this);
    render(
        () => (
            <>
                <p>Hello World</p>
            </>
        )
    );
};
const app = new App("#app", Hello, {
    dev: import.meta.env.DEV,
});
app.mount();
```

## Documentation

<div style="display: block;">

• [Blaze](https://github.com/ferdiansyah0611/blaze-script/blob/main/docs/blaze.md)
    
• [Router](https://github.com/ferdiansyah0611/blaze-script/blob/main/docs/router.md)
    
• [Extension](https://github.com/ferdiansyah0611/blaze-script/blob/main/docs/extension.md)
    
• [Helmet](https://github.com/ferdiansyah0611/blaze-script/blob/main/docs/helmet.md)
    
• [Tester](https://github.com/ferdiansyah0611/blaze-script/blob/main/docs/tester.md)

• [MediaQuery](https://github.com/ferdiansyah0611/blaze-script/blob/main/docs/mediaquery.md)

</div>

## More Info

-   Not recommendation for production because still on development
-   Updating TextNode Only Work In SPAN|P|H1|H2|H3|H4|H5|H6|A|BUTTON
-   Component must be have a key props if more than one
-   SVG work but if not work in anycase, add element property svg=""

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)