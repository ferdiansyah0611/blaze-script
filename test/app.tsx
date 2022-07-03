import App, {
	render,
	state,
	watch,
	batch,
	mount,
	init
} from './blaze'

const Component = function(){
	init(this)
	mount(() => {
		// console.log(1, this)
	}, this)
	state('state', {
		name: 'ferdiansyah',
	}, this)
	render(() => <>
		<p>Hello World {this.state.name}</p>
	</>, this)

	let now = 0
	let interval = setInterval(() => {
		this.state.name = 'ferdi ' + now
		now++
		if(now === 2){
			clearInterval(interval)
		}
	}, 2000)
}

const Counter = function(){
	init(this)
	state('state', {
		counter: 0
	}, this)
	
	this.increment = () => this.state.counter++
	this.decrement = () => this.state.counter--

	render(() => {
		return(
			<>
				<button onClick={this.increment}>Increment {String(this.state.counter)}</button>
				<button onClick={this.decrement}>Decrement {String(this.state.counter)}</button>
			</>
		)
	}, this)
}

const apps = function(){
	init(this)
	mount(() => {
		// console.log(this)
	}, this)
	state('state', {
		name: 'ferdiansyah',
		now: 0
	}, this)
	render(() => <>
		<p onClick={(e) => console.log(1)}>Hello World {String(this.state.now)}</p>
		<p>Hello World 2 {String(this.state.now)}</p>
		<div if={this.state.now >= 2}>
			<Component />
		</div>
		<div data-name={"ferdiansyah" + this.state.now} if={this.state.now === 2}>
			<p>ended</p>
		</div>
		<Counter/>
	</>, this)

	let interval = setInterval(() => {
		batch(() => {
			this.state.name = 'safina ' + this.state.now
			this.state.now += 1
			if(this.state.now === 2){
				clearInterval(interval)
			}
		}, this)
	}, 2000)
}
new App('#app', apps)
.mount()