// Application
export const App = function(el, component, config){
	this.mount = () => {
		document.addEventListener('DOMContentLoaded', () => {
			let app = new component()
			app.$node = app.render()
			app.$config = config
			// inject to window
			if(!window.$app) {
				window.$app = app
			}
			document.querySelector(el).append($app.$node)
			app.$deep.mount.handle()
		})
	}
	this.use = () => {
		return this
	}
	return this
}
export const getAppConfig = () => window.$app?.$config || {}
// utilites
export const log = (...msg) => getAppConfig().dev && console.log('>', ...msg)
export const render = (callback, component) => component.render = callback
export const state = function(name, initial, component){
	component[name] = new Proxy(initial, {
		set(a, b, c){
			a[b] = c
			if(!component.$deep.batch){
				component.$deep.trigger()
			}
			// watching
			if(component.$deep.watch){
				component.$deep.watch.forEach(watch => {
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
	if(!component.$deep.watch){
		component.$deep.watch = []
	}
	component.$deep.watch.push({
		dependencies, handle
	})
}
export const mount = (callback, component) => {
	component.$deep.mount.run = false
	component.$deep.mount.handle = (defineConfig = {}, update) => {
		if(update){
			batch(() => {
				Object.entries(defineConfig).forEach(item => {
					// check name property
					if(Object.keys(component.props).includes(item[0])){
						if(item[1] !== component.props[item[0]]){
							log('beda')
							component.props[item[0]] = item[1]
						}
					}
				})
			}, component)
		}
		if(!component.$deep.mount.run) {
			component.$deep.mount.run = true
			callback()
		}
	}
}
export const batch = async(callback, component) => {
	component.$deep.batch = true
	await callback()
	component.$deep.batch = false
	component.$deep.trigger()
}