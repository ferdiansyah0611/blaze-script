const log = (...msg) => console.log(...msg)

const diff = function(prev, el, $node){
	let batch = []
	if(!prev){
		return batch
	}
	if(!prev.isConnected){
		batch.push(() => $node.replaceWith(prev))
	}
	if(el === undefined){
		prev.remove()
	}
	// text
	if(prev.childNodes.length){
		prev.childNodes.forEach((node, i) => {
			if(node.data && node.data !== el.childNodes[i].data){
				batch.push(() => node.replaceWith(el.childNodes[i]))
			}
		})
	}
	// class
	if(prev.className !== el.className){
		batch.push(() => prev.className = el.className)
	}

	return batch
}

export const e = function(isFirst, component, nodeName, data, ...children){
	let text
	data = data ?? {}
	// component
	if(typeof nodeName === 'function'){
		if(!component.$registry){
			component.$registry = []
		}
		// registry component
		let key = data.key ?? 0
		let current = new nodeName(component)
		current.$h = jsx(current)
		let check = component.$registry.find(item => item.component.constructor.name === current.constructor.name && item.key === key)
		let render = current.render()
		current.$node = render
		if(!check) {
			let render = current.render()
			current.$node = render
			component.$registry.push({
				key,
				component: current,
				props: data.props ?? {}
			})
			return render
		}
		if(check.component && isFirst){
			let render = check.component.render()
			current.$node.replaceWith(render)
			if(current.$node.isConnected){
				check.component.$mount.handle()
			}
		}
		return current.$node
	}
	// fragment
	if(nodeName === 'Fragment') {
		nodeName = 'div'
		isFirst = true
	}

	let el = document.createElement(nodeName)
	let getPrevious = () => isFirst ? component.$node : component.$node.querySelector(`[data-name="${component.constructor.name}"][data-i="${component.$nodeId}"]`)
	let childrenHandle = () => {
		if(children.length === 1 && typeof children[0] === 'string'){
			el.append(document.createTextNode(children[0]))
		}
		else if(children.length){
			children.forEach(item => {
				// node
				if(item.nodeName){
					el.appendChild(item)
				}
				if(typeof item === 'string'){
					el.append(document.createTextNode(item))
				}
			})
		}
	}
	childrenHandle()


	// handle data element
	Object.keys(data).forEach(item => {
		if(item.match(/^on[A-Z]/)){
			el.addEventListener(item.toLowerCase().slice(2), data[item])
		}
		if(item === 'if') {
			let current = component.update ? getPrevious() : el
			if(data[item] === true){
				current.replaceChildren(el.children)
			}
			else {
				Array.from(current.children).forEach(node => {
					node.remove()
				})
			}
		}
		el[item] = data[item]
	})
	// first render
	if(!component.update){
		if(!component.$nodeId){
			component.$nodeId = 1
		}
		el.dataset.name = component.constructor.name
		el.dataset.i = component.$nodeId

		if(isFirst) {
			if(component.$mount) {
				component.$mount.handle()
			}
		}
	}
	// update render
	else {
		// diff in here
		let prev = getPrevious()
		let difference = diff(prev, el, component.$node)
		difference.forEach(batch => {
			batch()
		})
	}
	component.$nodeId++
	return el
}
// utilites
export const render = (callback, component) => component.render = callback
export const state = function(name, initial, component){
	component[name] = new Proxy(initial, {
		set(a, b, c){
			a[b] = c
			component.update = 1
			component.$nodeId = 1
			component.render()
			// watching
			if(component.$watch){
				component.$watch.forEach(watch => {
					let find = watch.dependencies.find(item => item === `${name}.${b}`)
					if(find) {
						watch.handle(b, c)
					}
				})
			}
			return true
		}
	})
	return component[name]
}
export const watch = function(dependencies, handle, component) {
	if(!component.$watch){
		component.$watch = []
	}
	component.$watch.push({
		dependencies, handle
	})
}
export const event = function(name, handle) {
	return{ name, handle }
}
export const mount = (callback, component) => {
	if(!component.$mount) {
		component.$mount = {}
	}
	component.$mount.run = false
	component.$mount.handle = (defineConfig = {}) => {
		if(defineConfig.props) {
			component.props = defineConfig.props
		}
		if(!component.$mount.run) {
			component.$mount.run = true
			callback()
		}
	}
}
export const jsx = (component) => {
	return {
		h: (...arg) => {
			return e(false, component, ...arg)
		},
		Fragment: 'Fragment'
	}
}
// App
const App = function(el, component){
	this.mount = () => {
		document.addEventListener('DOMContentLoaded', () => {
			let $app = new component()
			$app.$h = jsx($app)
			$app.$node = $app.render()
			window.$app = $app
			document.querySelector(el).append($app.$node)

			setInterval(console.clear, 10000)
		})
	}
	this.use = () => {
		return this
	}
	return this
}

export default App