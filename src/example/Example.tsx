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

export default Example