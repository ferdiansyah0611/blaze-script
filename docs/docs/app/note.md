# Create Note App

## Installation

```bash
git clone https://github.com/ferdiansyah0611/blaze-script && cd blaze-script && npm i
```

## Code

```tsx
import { render, init } from "@blaze";
// component
const Item = function() {
	const { render } = init(this);
	render(() => <div>
		<h6>{this.props.item.title}</h6>
		<p>{this.props.item.description}</p>
		<button onClick={() => this.props.edit(this.props.key)}>Edit</button>
		<button onClick={() => this.props.remove(this.props.key)}>Remove</button>
	</div>)
}

export default function Index() {
	const { state, render, batch } = init(this);
	state("state", {
		data: [],
		input: {
			title: "",
			description: "",
		},
	})
	const submit = () => {
		batch(() => {
			if (this.state.input.i) {
				this.state.data = this.state.data.map((item) => {
					if (item.id === this.state.input.i) {
						item = this.state.input;
					}
					return item;
				});
			} else {
				this.state.data.push({...this.state.input, id: crypto.randomUUID()});
			}

			this.state.input = {
				title: "",
				description: "",
			};
		});
	};
	const edit = (i) => (this.state.input = { ...this.state.data.find(d => d.id === i), i });
	const remove = (i) => {
		this.state.data = this.state.data.filter((data, key) => {
			if (data.id === i) {
				return false;
			}
			return true;
		});
	};
	render(
		() => (
			<div d class="index">
				<form d onSubmitPrevent={submit}>
					<div d>
						<input placeholder="Title" model="state.input.title" type="text"/>
					</div>
					<div d>
						<textarea placeholder="Description" model="state.input.description" cols="30" rows="10"></textarea>
					</div>
					<button d type="submit">Submit</button>
				</form>
				<div for>
					{this.state.data.map((item) => (
						<Item key={item.id} item={item} edit={edit} remove={remove} />
					))}
				</div>
			</div>
		)
	);
};
```

## Run Dev

```bash
npm run dev
```