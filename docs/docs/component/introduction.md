# Introduction

This section is about using components.

## Getting Started

To create a component, you must create a function like the following.

```tsx
import { init } from "@blaze";

const World = function() {
	const { render } = init(this);
	render(() => <div>
		<p>Hello World</p>
	</div>)
}
```

To call another component with a specific component, you must add a key to make it stored in memory and must be unique. By default, the key will automatically be 0. However, the key can also accept a string for its value.

```tsx
import { init } from "@blaze";

const Sidebar = function() {
	const { render } = init(this);
	render(() => <p>Sidebar</p>)
}

const Navbar = function() {
	const { render } = init(this);
	render(() => <p>Navbar</p>)
}
const App = function() {
	const { render } = init(this);
	render(() => <div>
		<p>Hello World</p>
		<Sidebar/>
		<Sidebar key={1}/>
		<Navbar/>
	</div>)
}
```

To access the child component, as follows

```tsx
const Sidebar = function() {
	const { render } = init(this);
	render(() => <div>{this.children}</div>);
}

const App = function() {
	const { render } = init(this);
	render(() => <div>
		<Sidebar>
			<p>Children</p>
		</Sidebar>
	</div>)
}
```

Use props and access them.

```tsx
const Sidebar = function() {
	const { render } = init(this);
	render(() => <div>
		<p>{this.props.name}</p>
	</div>);
}

const App = function() {
	const { render } = init(this);
	render(() => <div>
		<Sidebar name="Ferdiansyah" />
	</div>)
}
```

Don't recommendation if fragment in first render

```tsx
const App = function() {
	const { render } = init(this);
	// can't work
	render(() => <>
		<Sidebar name="Ferdiansyah" />
	</>)
	// work
	render(() => <div>
		<Sidebar name="Ferdiansyah" />
	</div>)
}
```