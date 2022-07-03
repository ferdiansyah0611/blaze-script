const log = (...msg) => console.log('>', ...msg)

const diff = function(prev, el){
	let batch = []
	if(!prev){
		return batch
	}
	if(el === undefined){
		prev.remove()
	}
	// text
	if(prev.childNodes.length){
		prev.childNodes.forEach((node, i) => {
			if(node && el.childNodes[i]){
				if(node.data && node.data !== el.childNodes[i].data){
					batch.push(() => {
						log('[text]', node.data, '>', el.childNodes[i].data)
						node.replaceWith(el.childNodes[i])
					})
				}
			}
		})
	}
	// class
	if(prev.className !== el.className){
		batch.push(() => prev.className = el.className)
	}
	// attribute
	if(prev.attributes.length){
		if(typeof prev.if === 'boolean'){
			if(prev.if){
				log(prev.attributes.length, el.attributes.length, prev.if, el.if)
				for (var i = 0; i < prev.attributes.length; i++) {
					if(prev.attributes[i].name === 'data-logic'){
						prev.removeAttribute('style')
						break
					}
				}
			}
		}
		for (var i = 0; i < prev.attributes.length; i++) {
			prev.attributes[i]
			if((prev.attributes[i] && el.attributes[i]) && prev.attributes[i].name === el.attributes[i].name){
				if(prev.attributes[i].value !== el.attributes[i].value) {
					log('different', prev.attributes[i], el.attributes[i])
					prev.attributes[i].value = el.attributes[i].value
				}
			}
		}
	}

	return batch
}

export const e = function(isFirst, component, nodeName, data, ...children){
	let text
	data = data ?? {}
	// component
	if(typeof nodeName === 'function'){
		if(!component.$deep.registry){
			component.$deep.registry = []
		}
		// registry component
		let key = data.key ?? 0
		let current = new nodeName(component)
		init(current)
		let check = component.$deep.registry.find(item => item.component.constructor.name === current.constructor.name && item.key === key)
		let render = current.render()
		current.$node = render
		if(!check) {
			component.$deep.registry.push({
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
				check.component.$deep.mount.handle()
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
	let getPrevious = () => isFirst ? component.$deep.node[component.$deep.node.length - 1].el : component.$deep.node[component.$deep.$id - 1].el
	let childrenHandle = () => {
		if(children.length === 1 && typeof children[0] === 'string'){
			el.append(document.createTextNode(children[0]))
		}
		else if(children.length){
			children.forEach(item => {
				// node
				if(item.nodeName){
					if(!component.$deep.update){
						log('[appendChild]', item.tagName)
						el.appendChild(item)
					}
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
		// event
		if(item.match(/^on[A-Z]/)){
			el.addEventListener(item.toLowerCase().slice(2), data[item])
			delete data[item.match(/^on[A-Z][a-z]+/)[0]]
		}
		// logic
		if(item === 'if') {
			log('[if]', data[item])

			let current = component.$deep.update ? getPrevious() : el
			let find = component.$deep.node.find(item => item.key === component.$deep.$id) || {}
			if(!find){
				component.$deep.node.push({
					key: component.$deep.$id,
					el: current
				})
				log('[if > current]', current)
			}
			let handle = () => {
				let currentEl = (find.el || current)
				currentEl.dataset.logic = true
				if(data[item] === true){
					currentEl.if = true
					currentEl.style.display = 'block'
				}
				else {
					currentEl.if = false
					currentEl.style.display = 'none'
				}

				// delete data.if
				// log(1, find.el, el)
			}
			handle()
		}
		if(item.match(/^data-/)){
			let name = item.split('data-')[1]
			el.dataset[name] = data[item]
			delete data[item.match(/^data-\S+/)[0]]
		}
		el[item] = data[item]
	})
	// first render
	if(!component.$deep.update){
		if(!component.$deep.$id){
			component.$deep.$id = 1
		}

		if(isFirst) {
			if(component.$deep.mount) {
				component.$deep.mount.handle()
			}
		}
		component.$deep.node.push({
			key: component.$deep.$id,
			el
		})
		component.$deep.$id++
		return el
	}
	// update render
	else {
		// diff in here
		let prev = getPrevious()
		if(!isFirst){
			let difference = diff(prev, el)
			difference.forEach(batch => {
				batch()
			})
			component.$deep.$id++
			return prev
		}
	}
}

// setup
export const init = (component) => {
	if(!component.$deep){
		component.$deep = {
			batch: false,
			node: [],
			registry: [],
			update: 0,
			mount: {
				run: false,
				handle: Function
			}
		}
		component.$h = jsx(component)
	}
}
// utilites
export const render = (callback, component) => component.render = callback
export const state = function(name, initial, component){
	component[name] = new Proxy(initial, {
		set(a, b, c){
			a[b] = c
			if(!component.$deep.batch){
				component.$deep.update++
				component.$deep.$id = 1
				component.render()
			}
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
export const mount = (callback, component) => {
	component.$deep.mount.run = false
	component.$deep.mount.handle = (defineConfig = {}) => {
		if(defineConfig.props) {
			component.props = defineConfig.props
		}
		if(!component.$deep.mount.run) {
			component.$deep.mount.run = true
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
export const batch = async(callback, component) => {
	component.$deep.batch = true
	await callback()
	component.$deep.batch = false
	component.$deep.update++
	component.$deep.$id = 1
	component.render()
}

// App
const App = function(el, component){
	this.mount = () => {
		document.addEventListener('DOMContentLoaded', () => {
			let $app = new component()
			$app.$node = $app.render()
			window.$app = $app
			document.querySelector(el).append($app.$node)

			// setInterval(console.clear, 10000)
		})
	}
	this.use = () => {
		return this
	}
	return this
}

export default App