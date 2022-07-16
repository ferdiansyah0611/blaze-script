import { render, state, watch, log, init } from "@blaze";

const Counter = function () {
	init(this);
	state(
		"state",
		{
			counter: 0,
		},
		this
	);
	let clear = () => {
		console.clear()
		return true
	}

	let increment = () => clear() && this.state.counter++;
	let decrement = () => clear() && this.state.counter--;
	let primary =
		"focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700";
	let secondary =
		"focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-red-600 dark:hover:bg-red-700";

	watch(["state.counter"], (a, b) => log(a, b), this);

	render(() => {
		return (
			<>
				<div d>
					<div d>
						<p>{this.state.counter} Click</p>
					</div>
					<div d className="flex justify-center space-x-2 mt-2">
						<button onClick={increment} type="button" className={primary}>
							Increment
						</button>
						<button onClick={decrement} type="button" className={secondary}>
							Decrement
						</button>
					</div>
				</div>
				<div className="flex justify-center">
					<button onClick={() => window.open('/example/index.html')} type="button" className={primary}>
						More Example
					</button>
				</div>
			</>
		);
	}, this);
};

export default Counter;