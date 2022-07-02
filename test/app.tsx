import App, {
	render,
	event,
	state,
	watch,
	mount,
} from './blaze'

const Component = function(){
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
		if(now === 5){
			clearInterval(interval)
		}
	}, 2000)
}

const apps = function(){
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
		<p>now {this.state.now}</p>
		<div if={this.state.now >= 2}>
			<Component />
		</div>
		<div if={this.state.now === 5}>
			<p>ended</p>
		</div>
	</>, this)

	let interval = setInterval(() => {
		// this.state.name = 'safina ' + this.state.now
		this.state.now += 1
		if(this.state.now === 5){
			clearInterval(interval)
		}
	}, 2000)
}
new App('#app', apps)
.mount()