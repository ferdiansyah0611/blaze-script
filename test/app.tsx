import App, {
	render,
	state,
	watch,
	batch,
	mount,
	log,
	init
} from './blaze'

const Example = function(){
	init(this)
	mount(() => {
		console.log(11111111111, this)
	}, this)
	state('state', {
		name: 'ferdiansyah',
	}, this)
	render(() => <>
		<p>Hi {this.state.name} {this.props.status}</p>
	</>, this)

	let now = 0
	let interval = setInterval(() => {
		this.state.name = 'ferdiansyah ' + now
		now++
		if(now === 6){
			clearInterval(interval)
		}
	}, 2000)
}

const Counter = function(){
	init(this)
	state('state', {
		counter: 0
	}, this)

	let increment = () => this.state.counter++
	let decrement = () => this.state.counter--

	watch(['state.counter'], (a, b) => log(a, b), this)

	render(() => {
		return(
			<>
				<div>
					<input onKeyUp={(e) => this.state.counter = (e.target.value)} value={this.state.counter} type="number" disabled />
					<button onClick={increment}>Increment</button>
					<button onClick={decrement}>Decrement</button>
				</div>
			</>
		)
	}, this)
}

const apps = function(){
	init(this)
	mount(() => {
		console.log('ok')
	}, this)

	state('state', {
		name: 'ferdiansyah',
		now: 0
	}, this)
	render(() => <>
		<p onClick={(e) => log(1)}>Interval {this.state.now}</p>
		<div if={this.state.now >= 2}>
			<Example props={{status: this.state.now}} />
		</div>
		<div data-name={"ferdiansyah" + this.state.now} if={this.state.now === 5}>
			<p>END</p>
		</div>
		<Counter/>
	</>, this)

	let interval = setInterval(() => {
		batch(() => {
			this.state.name = 'safina ' + this.state.now
			this.state.now += 1
			if(this.state.now === 10){
				clearInterval(interval)
			}
			// console.clear()
		}, this)
	}, 2000)
}
new App('#app', apps, {
	dev: true
})
.mount()