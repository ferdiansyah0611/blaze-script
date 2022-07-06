const Counter = function (app) {
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
							onKeyUpValue={(value) => (this.state.counter = value)}
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

export default Counter