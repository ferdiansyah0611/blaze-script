import diff from './diff'
import {
	log,
	render,
	state,
	watch,
	mount,
	batch,
	App
} from './utils'

export {
	log,
	render,
	state,
	watch,
	mount,
	batch
}
export default App

export const e = function(first, component, nodeName, data, ...children){
	let text
	let $deep = component.$deep
	data = data ?? {}
	// component
	if(typeof nodeName === 'function'){
		let key = data.key ?? 0
		let current = new nodeName(component)
		let check = $deep.registry.find(item => item.component.constructor.name === current.constructor.name && item.key === key)
		// registry component
		if(!check) {
			// props registery
			current.props = new Proxy(data.props || {}, {
				set(a, b, c){
					a[b] = c
					current.$deep.trigger()
					return true
				}
			})

			let render = current.render()
			current.$node = render
			current.$node.dataset.key = key
			current.$node.childrenComponent = component
			$deep.registry.push({
				key,
				component: current
			})
			console.log('[registery]', component.constructor.name)
			return current.$node
		}
		check.component.$deep.mount.handle(data.props, true)
		return check.component.$node
	}
	// fragment
	if(nodeName === 'Fragment') {
		nodeName = 'div'
		first = true
	}
	// element
	let el = document.createElement(nodeName)
	let getPrevious = () => first ? $deep.node[$deep.node.length - 1]?.el : $deep.node[$deep.$id - 1]?.el
	let childrenHandle = () => {
		if(children.length === 1 && typeof children[0] === 'string'){
			el.append(document.createTextNode(children[0]))
		}
		else if(children.length){
			children.forEach(item => {
				// node
				if(item && item.nodeName){
					if(!$deep.update){
						log('[appendChild]', item.tagName)
						el.appendChild(item)
					}
				}
				if(['string', 'number'].includes(typeof item)){
					if(item === undefined){
						item = ' '
					}
					el.append(document.createTextNode(String(item.toString())))
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

			let current = $deep.update ? getPrevious() : el
			let find = $deep.node.find(item => item.key === $deep.$id) || {}
			if(!find){
				$deep.node.push({
					key: $deep.$id,
					el: current
				})
				log('[if > current]', current)
			}
			let handle = () => {
				let currentEl = (find.el || current)
				let applyChildren = () => {
					if(!currentEl.childrenCommit){
						currentEl.childrenCommit = Array.from(currentEl.children)
					}
				}
				if(data[item] === true){
					if(!currentEl.hasAppend){
						currentEl.childrenCommit.forEach(item => currentEl.appendChild(item))
					}
					currentEl.if = true
					currentEl.hasAppend = true
					applyChildren()
				}
				else {
					currentEl.if = false
					currentEl.hasAppend = false
					applyChildren()
					Array.from(currentEl.children).forEach(item => item.remove())
				}
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
	if(!$deep.update){
		if(!$deep.$id){
			$deep.$id = 1
		}

		if(first) {
			if($deep.mount && el.isConnected) {
				$deep.mount.handle()
			}
			el.dataset.component = component.constructor.name
		}
		$deep.node.push({
			key: $deep.$id,
			el
		})
		$deep.$id++
		return el
	}
	// update render
	else {
		// diff in here
		let prev = getPrevious()
		if(!first){
			let difference = diff(prev, el)
			difference.forEach(batch => {
				batch()
			})
			$deep.$id++
			return prev
		}
		if(first && prev){
			if(prev.dataset && prev.childrenComponent){
				let dataset = prev.dataset
				let check = prev.childrenComponent.$deep.registry.find(item => item.component.constructor.name === dataset.component && item.key === Number(dataset.key))
				if(check.component.$node.isConnected){
					check.component.$deep.mount.handle()
				}
			}
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
			watch: [],
			update: 0,
			mount: {
				run: false,
				handle: (props) => false
			},
			trigger: () => {
				component.$deep.update++
				component.$deep.$id = 1
				component.render()
			},
		}

		component.props = {}
		component.$h = jsx(component)
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