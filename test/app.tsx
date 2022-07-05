import App from "./blaze";

const Example = function () {
	init(this);
	mount(() => {
		console.log(11111111111, this);

		let now = 0;
		let interval = setInterval(() => {
			this.state.name = "ferdiansyah " + now;
			now++;
			if (now === 6) {
				clearInterval(interval);
			}
		}, 2000);

		return() => {
			console.log('unmount')
			clearInterval(interval);
		}
	}, this);
	state(
		"state",
		{
			name: "ferdiansyah",
		},
		this
	);
	watch(["props.status"], (a, b) => console.log(a, b), this);
	render(
		() => (
			<>
				<p>
					Hi {this.state.name} {this.props.status}
				</p>
			</>
		),
		this
	);

};

const Counter = function () {
	init(this);
	state(
		"state",
		{
			counter: 0,
		},
		this
	);

	let increment = () => this.state.counter++;
	let decrement = () => this.state.counter--;
	let primary =
		"focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700";
	let secondary =
		"focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-red-600 dark:hover:bg-red-700";

	watch(["state.counter"], (a, b) => log(a, b), this);

	render(() => {
		return (
			<>
				<div>
					<div>
						<label
							for="visitors"
							className="block mb-2 text-sm font-medium text-gray-900"
						>
							Counter
						</label>
						<input
							onKeyUp={(e) => (this.state.counter = e.target.value)}
							value={this.state.counter}
							type="number"
							id="visitors"
							className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
							disabled
						/>
					</div>
					<div className="flex space-x-2 mt-2">
						<button onClick={increment} type="button" className={primary}>
							Increment
						</button>
						<button onClick={decrement} type="button" className={secondary}>
							Decrement
						</button>
					</div>
				</div>
			</>
		);
	}, this);
};

const apps = function () {
	init(this);
	mount(() => {
		let interval = setInterval(() => {
			batch(() => {
				this.state.name = "safina " + this.state.now;
				this.state.now += 1;
				if (this.state.now === 5) {
					clearInterval(interval);
				}
				// console.clear();
			}, this);
		}, 2000);
	}, this);

	state(
		"state",
		{
			name: "ferdiansyah",
			now: 0,
		},
		this
	);

	refs('text', this, true)

	render(
		() => (
			<>
				<div className="p-4">
					<p refs="text" i={0} onClick={(e) => log(1)}>Interval {this.state.now}</p>
					<div if={this.state.now > 2}>
						<Example props={{ status: this.state.now }} />
					</div>
					<div
						data-name={this.state.name}
						if={this.state.now === 5}
					>
						<p>Done</p>
					</div>
					<div else>
						<p>Please Wait...</p>
					</div>
					<Counter />
				</div>
			</>
		),
		this
	);
};

new App("#app", apps, {
	dev: true,
}).mount();
