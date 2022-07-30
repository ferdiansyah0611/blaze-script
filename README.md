<div align="center">

# Blaze Script

Is a framework for building large-scale single page applications with similar codeability as React Js and Vue Js

</div>

## Feature

-   Virtual DOM
-   State Management
-   Lifecycle
-   JSX Syntax
-   Batch
-   Navigation, Cache Request, Error Handling And More

## Get Started

```tsx
import App, { init } from "@blaze";

const Hello = function () {
    const { render } = init(this);
    render(
        () => (
            <p>Hello World</p>
        )
    );
};
const app = new App("#app", Hello, {
    dev: import.meta.env.DEV,
});
app.mount();
```

## Information

Not recommendation for production because still on development. If found a bug, create new issues on repository.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)