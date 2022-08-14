import { Component, Watch, Mount, State } from "../blaze.d";
import Lifecycle from "./lifecycle";
import { Store, HMR, App } from "./global";

/**
 * @config
 * get blaze app or config
 */
export const getAppConfig = (key) => {
	let app = App.get(key);
	if (app) {
		return app.config;
	}
	return {};
};

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
export const state = function <T>(name: State<T>["name"], initial: T, component: State<T>["component"], call?: any) {
	const isContext = typeof call === "function";
	const handle = (b: string, c: any, lifecycle?: any) => {
		// watching
		component.$deep.watch.forEach((watch: Watch) => {
			let find = watch.dependencies.find((item: string) => item === `${name}.${b}`);
			if (find) {
				watch.handle(b, c);
			}
		});
		if (lifecycle && !component.$deep.batch) lifecycle.effect(`${name}.${b}`, c);
	};
	const validate = (newName?: string, withSub?: string) => {
		return {
			get(a, b, receiver) {
				if (typeof a[b] === "object" && !Array.isArray(a[b]) && b.indexOf("$") === -1) {
					let commit = { ...a[b] };
					if (isContext) {
						commit._isContext = true;
					} else {
						commit._isProxy = true;
					}
					return new Proxy(commit, validate(b, b));
				}
				return Reflect.get(a, b, receiver);
			},
			set(a: any, b: string, c: any) {
				if (a[b] === c) return true;

				if (isContext) {
					a[b] = c;
					let { registery, listening } = call();

					registery.forEach((register: Component, i) => {
						let disable = register.$deep.disableTrigger;
						let lifecycle = new Lifecycle(register);
						if (register.$deep.batch) {
							register.$deep.queue.push({
								name: `ctx.${newName}.${b}`,
								value: c,
							});
						}
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
							lifecycle.watch((item: string) => {
								return item === `ctx.${newName}.${b}`;
							}, c);
							if (!register.$deep.batch) {
								lifecycle.effect(`ctx.${newName}.${b}`, c);
							}
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
				} else {
					let allowed = !component.$deep.batch && !component.$deep.disableTrigger;
					let lifecycle = new Lifecycle(component);

					if (allowed) {
						lifecycle.beforeUpdate();
					}

					a[b] = c;

					if (component.$deep.batch) {
						component.$deep.queue.push({
							name: `${name}.${b}`,
							value: c,
						});
					}

					if (allowed && component.$deep.hasMount) {
						lifecycle.updated();
						component.$deep.trigger();
					}
					if (!component.$deep.disableTrigger) {
						handle(b, c, lifecycle);
					}
				}
				return true;
			},
		};
	};

	// for context
	if (isContext) {
		return new Proxy({ ...initial, _isContext: true }, validate(name));
	}
	// for state
	else {
		if (!name) {
			name = "state";
		}
		component[name] = new Proxy({ ...initial, _isProxy: true }, validate(name));
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
	let values = state(entry, defaultContext, null, () => ({ registery, listening }));
	// only dev
	if (import.meta.env.DEV) {
		if (!Store.get()[entry]) {
			Store.set(entry, {
				registery,
				listening,
				values,
			});
		}
	}
	return (listen, component, reload) => {
		if (reload) return { entry, registery, listening, values };
		if (!Array.isArray(listen)) component = listen;
		if (action) {
			if (!component.$deep.dispatch) {
				component.$deep.dispatch = {};
			}
			component.$deep.dispatch[entry] = action;
		}
		let hmrArray = HMR.get();
		if (hmrArray.length) {
			hmrArray.forEach((hmr) => {
				registery = registery.map((item) => {
					if (item.constructor.name === hmr.name) {
						item = Object.assign(item, item.$node.$children);
					}
					return item;
				});
			});
			return values;
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
export const watch = function (dependencies: Watch["dependencies"], handle: Watch["handle"], component: Component) {
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
 * @effect
 * auto effect a state or props on component
 */
export const effect = function (callback: () => any, component: Component) {
	if (!component.$deep.effect) {
		component.$deep.effect = [];
	}
	let key = component.$deep.effect.push(callback);
	return {
		clear: () => (component.$deep.effect = component.$deep.effect.filter((...data: any) => data[1] !== key - 1)),
	};
};

/**
 * @mount
 * lifecycle methods on first render, can be multiply mount
 */
export const mount = (callback: () => any, component: Component) => {
	let data: Mount = {
		run: false,
		handle(defineConfig = {}, update = false, enabled = false) {
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
			if (!this.run || enabled) {
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
		let lifecycle = new Lifecycle(component);
		lifecycle.beforeUpdate();
		component.$deep.batch = true;
		component.$deep.queue = [];

		await callback();

		component.$deep.batch = false;

		// run effect
		if (component.$deep.queue) {
			let potential = [];
			component.$deep.queue.forEach((queue) => {
				lifecycle.effect(queue.name, queue.value, (data) => potential.push(data));
			});
			if (potential.length) {
				let result = [...new Set(potential)];
				result.forEach((results) => results());
			}
			delete component.$deep.queue;
		}

		lifecycle.updated();
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
