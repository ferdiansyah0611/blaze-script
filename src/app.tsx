import { App } from "@blaze.utils";
import { makeRouter, page } from "@blaze.router";
import Counter from "./example/Counter";
import Example from "./example/Example";
import Alert from './component/Alert'

const user = context('user', {
	email: 'admin@gmail.com'
})

const apps = function () {
	init(this);
	user(this);

	mount(() => {
		let interval = setInterval(() => {
			batch(() => {
				this.state.name = "safina " + this.state.now;
				this.state.now += 1;
				if (this.state.now === 5) {
					clearInterval(interval);
				}
			}, this);
		}, 2000);
	}, this);

	state(
		"state",
		{
			name: "ferdiansyah",
			now: 0,
			data: ["hi", "hi", "hi"],
		},
		this
	);

	refs("text", this, true);

	render(
		() => (
			<>
				<div className="p-4">
					<p refs="text" i={0} onClickPrevent={() => log(1)}>
						Interval {this.state.now} {this.ctx.user.email}
					</p>
					<div id="route"></div>
					<Counter />
				</div>
			</>
		),
		this
	);
};

const Hello = function () {
	init(this);
	render(
		() => (
			<>
				<p>Hello World</p>
			</>
		),
		this
	);
};
const Hello2 = function (app) {
	init(this);
	render(
		() => (
			<>
				<p>Hello World 2 {app.params.id}</p>
				<Alert props={{title: 'Alert!', message: 'Lorem ipsum'}} />
			</>
		),
		this
	);
};
const NotFound = function () {
	init(this);
	render(
		() => (
			<>
				<p>404</p>
			</>
		),
		this
	);
};

const app = new App("#app", apps, {
	dev: import.meta.env.DEV,
});
app.use(
	makeRouter("#route", {
		url: [
			page("/", Hello),
			page("/test", Hello2),
			page("/test/:id", Hello2),
			page("", NotFound),
		],
	})
);
app.mount();

{
	/*<ul>
	{this.state.data.map((item, key) => (
		<li>
			{item} {key} {this.state.now}
		</li>
	))}
</ul>
<div if={this.state.now > 2}>
	<Example props={{ status: this.state.now }} />
</div>
<div data-name={this.state.name} if={this.state.now === 5}>
	<p>Done</p>
</div>
<div else>
	<p>Please Wait...</p>
</div>*/
}
