<div align="center">
    <h1>Blaze Script</h1>
    <p>Is a framework for building large-scale single page applications with similar codeability as React Js and Vue Js</p>
</div>

## Feature

-   Virtual DOM
-   State Management
-   Lifecycle
-   JSX Syntax
-   Batch
-   Navigation, Cache Request, Error Handling And More
-   Uses few third-party packages
-   Reactive Effect

## Installation

```bash
git clone git@github.com:ferdiansyah0611/blaze-script.git myapp && cd myapp && npm i
```

By default, typescript is not installed in node_modules and we use tsc globally. if you haven't installed typescript on your device, you can install it using `npm i typescript`

## Get Started

```tsx
// Apps.tsx
import App, { init } from "@blaze";
import { createApp } from "@root/render";
import withError from "@root/plugin/error";

export default function Apps() {
    const { render } = init(this);
    render(() => <p>Hello World</p>);
}
```

```tsx
// main.ts
import MyApp from "@/Apps";
import { createApp } from "@root/render";
import withError from "@root/plugin/error";

const app = new createApp("#app", MyApp, {
    dev: false,
});
app.use(withError());
app.mount();
```

## Information

Not recommendation for production because still on development. If found a bug, create new issues on repository.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
