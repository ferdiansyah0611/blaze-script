import { beforeUpdateCall, updatedCall } from "./core";
import { Component, Watch, Mount } from "./blaze.d";

/**
 * @config
 * get blaze app or config
 */
export const getAppConfig = (key) => window.$app[key].$config || {};
export const getBlaze = (key) => window.$blaze[key] || {};

/*----------UTILITES----------*/

/**
 * @logging
 * log for blaze, disable in production
 */
export const log = (...msg: any[]) => getAppConfig(0).dev && console.log(">", ...msg);

/**
 * @render
 * utils for rendering
 */
export const render = (callback: () => HTMLElement, component: Component) => (component.render = callback);

/**
 * @state
 * state management and context on blaze
 */
export const state = function (
	name: string | any,
	initial: any,
	component: Component | null,
	registryCall?: () => Component[],
	listeningCall?: () => any[]
) {
	// for context
	if (typeof registryCall === 'function') {
		let validate = (newName?: string, withSub?: string) => {
			return {
				get(a, b, receiver) {
					if (typeof a[b] === "object" && !Array.isArray(a[b])) {
						return new Proxy({ ...a[b], _isContext: true }, validate(b, b));
					}
					return Reflect.get(a, b, receiver);
				},
				set(a: any, b: string, c: any) {
					if (a[b] === c) return true;
					a[b] = c;
					let registry = registryCall();
					let listening = listeningCall();

					registry.forEach((register: Component, i) => {
						let disable = register.$deep.disableTrigger;
						const disableOnNotList = () => {
							let currentListening = listening[i];
							if (
								currentListening &&
								currentListening.listen.find((listen) => listen === (withSub ? withSub : b))
							) {
								disable = false;
							} else {
								disable = true;
							}
						};
						const watchRun = () => {
							// watching
							register.$deep.watch.forEach((watch: Watch) => {
								let find = watch.dependencies.find((item: string) => item === `ctx.${newName}.${b}`);
								if (find) {
									watch.handle(b, c);
								}
							});
						};
						disableOnNotList();
						if (disable) {
							disable = false;
							watchRun();
							return;
						}
						if (!register.$deep.batch && register.$deep.hasMount) {
							register.$deep.trigger();
						}
						watchRun();

						disable = false;
					});
					return true;
				},
			};
		};
		return new Proxy({ ...initial, _isContext: true }, validate(name));
	}
	// for state
	else {
		let validate = {
			get(a, b, receiver) {
				if (typeof a[b] === "object" && !Array.isArray(a[b])) {
					return new Proxy({ ...a[b], _isProxy: true }, validate);
				}
				return Reflect.get(a, b, receiver);
			},
			set(a, b, c) {
				if (a[b] === c) return true;

				let allowed = !component.$deep.batch && !component.$deep.disableTrigger;
				if (allowed) {
					beforeUpdateCall(component.$deep);
				}

				a[b] = c;

				if (allowed && component.$deep.hasMount) {
					updatedCall(component.$deep);
					component.$deep.trigger();
				}
				if (!component.$deep.disableTrigger) {
					handle(b, c);
				}
				return true;
			},
		};
		let handle = (b, c) => {
			// watching
			component.$deep.watch.forEach((watch: Watch) => {
				let find = watch.dependencies.find((item: string) => item === `${name}.${b}`);
				if (find) {
					watch.handle(b, c);
				}
			});
		};
		// for update
		if (!name) {
			name = "state";
		}
		component[name] = new Proxy({ ...initial, _isProxy: true }, validate);
		// trigger for first render
		if (name === "props" && !component.$deep.update) {
			component.$deep.disableTrigger = true;
			for (const props of Object.entries(component.props)) {
				handle(props[0], props[1]);
			}
			component.$deep.disableTrigger = false;
			mount(() => {
				component.$deep.trigger();
			}, component);
		}
		return component[name];
	}
};

/**
 * @context
 * context on blaze
 */
export const context = (entry: string, defaultContext: any, action: any) => {
	let registery: Component[] = [];
	let listening: any[] = [];
	let values = state(entry, defaultContext, null, () => registery, () => listening);
	return (listen, component) => {
		if (!Array.isArray(listen)) component = listen;
		if (action) {
			if (!component.$deep.dispatch) {
				component.$deep.dispatch = {};
			}
			component.$deep.dispatch[entry] = action;
		}
		if (window.$hmr) {
			let current;
			registery = registery.map((item) => {
				if (item.constructor.name === window.$hmr.name) {
					current = Object.assign(item, item.$node.$children);
				}
				return item;
			});
			return current;
		}
		let index = registery.push(component);
		if (Array.isArray(listen)) {
			listening.push({
				listen,
			});
		}
		component.ctx[entry] = values;

		component.$deep.unmount.push(() => {
			registery = registery.filter((_a, b) => b !== index - 1);
			listening = listening.filter((_a, b) => b !== index - 1);
		});

		return values;
	};
};

/**
 * @watch
 * watching a state or props on component
 */
export const watch = function (dependencies: string[], handle: (a, b) => any, component: Component) {
	if (!component.$deep.watch) {
		component.$deep.watch = [];
	}
	let key = component.$deep.watch.push({
		dependencies,
		handle,
	});
	return {
		clear: () => (component.$deep.watch = component.$deep.watch.filter((...data: any) => data[1] !== key - 1)),
	};
};

/**
 * @mount
 * lifecycle methods on first render, can be multiply mount
 */
export const mount = (callback: () => any, component: Component) => {
	let data: Mount = {
		run: false,
		handle(defineConfig = {}, update = false) {
			if (update) {
				// batch if props 0 length
				if (Object.keys(defineConfig).length) {
					batch(() => {
						Object.entries(defineConfig).forEach((item: any[]) => {
							// check name property and value is different
							if (Object.keys(component.props).includes(item[0])) {
								if (item[1] !== component.props[item[0]]) {
									component.props[item[0]] = item[1];
									// watching
									component.$deep.watch.forEach((watch) => {
										let find = watch.dependencies.find(
											(dependencies) => dependencies === `props.${item[0]}`
										);
										if (find) {
											watch.handle(item[0], item[1]);
										}
									});
								}
							}
						});
					}, component);
				}
			}
			if (!this.run) {
				this.run = true;
				let unmount = callback();
				if (!component.$deep.disableAddUnmount && unmount) {
					component.$deep.unmount.push(unmount);
				}
			}
		},
	};

	component.$deep.mount.push(data);
};

/**
 * @layout
 * lifecycle methods on all render
 */
export const layout = (callback: () => any, component: Component) => {
	if (!component.$deep.layout) {
		component.$deep.layout = [];
	}
	component.$deep.layout.push(callback);
	return true;
};

/**
 * @beforeCreate
 * lifecycle methods on before before create component
 */
export const beforeCreate = (callback: () => any, component: Component) => {
	if (!component.$deep.beforeCreate) {
		component.$deep.beforeCreate = [];
	}
	component.$deep.beforeCreate.push(callback);
	return true;
};

/**
 * @created
 * lifecycle methods on created component
 */
export const created = (callback: () => any, component: Component) => {
	if (!component.$deep.created) {
		component.$deep.created = [];
	}
	component.$deep.created.push(callback);
	return true;
};

/**
 * @beforeUpdate
 * lifecycle methods on before updated component
 */
export const beforeUpdate = (callback: () => any, component: Component) => {
	if (!component.$deep.beforeUpdate) {
		component.$deep.beforeUpdate = [];
	}
	component.$deep.beforeUpdate.push(callback);
	return true;
};

/**
 * @updated
 * lifecycle methods on before updated component
 */
export const updated = (callback: () => any, component: Component) => {
	if (!component.$deep.updated) {
		component.$deep.updated = [];
	}
	component.$deep.updated.push(callback);
	return true;
};

/**
 * @batch
 * utils for re-rendering
 */
export const batch = async (callback: () => any, component: Component) => {
	if (component) {
		beforeUpdateCall(component.$deep);
		component.$deep.batch = true;
		await callback();
		component.$deep.batch = false;
		updatedCall(component.$deep);
		component.$deep.trigger();
	}
};

/**
 * @dispatch
 * utils for call context action
 */
export const dispatch = (name: string, component: Component, data: any, autoBatching: boolean = false) => {
	let path = name.split(".");
	let entry = path[0];
	let key = path[1];
	let check = component.$deep.dispatch[entry];

	let action = () => check[key](component["ctx"][entry], data);

	if (check) {
		if (autoBatching) {
			batch(action, component);
		} else {
			action();
		}
	}
};

/**
 * @computed
 * shorted a code, customize data, and action function.
 */
export const computed = (callback: () => any, component: Component) => {
	let data = callback.bind(component)();
	let getter = data.get || {};
	let setter = data.set || {};
	let method = data.method || {};
	for (const name of Object.keys(getter)) {
		Object.defineProperty(component, name, {
			get: () => {
				return getter[name]();
			},
		});
	}
	for (const name of Object.keys(setter)) {
		Object.defineProperty(component, name, {
			set: () => {
				return setter[name]();
			},
		});
	}
	Object.assign(component, method);
};

export const lazy = (callback: () => any) => {
	return {
		lazy: true,
		component: callback,
	};
};

export const defineProp = (props: any, component: Component) => {
	component.props = props;
};
