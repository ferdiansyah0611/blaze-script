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
export const render = (callback: Function, component: Component) => (component.render = callback);

/**
 * @state
 * state management and context on blaze
 */
export const state = function (name: string, initial: any, component: Component | null, registry?: Component[]) {
	// for context
	if (Array.isArray(registry)) {
		return new Proxy(
			{ ...initial, _isContext: true },
			{
				set(a: any, b: string, c: any) {
					a[b] = c;
					registry.forEach((register: Component) => {
						if (!register.$deep.batch && register.$deep.hasMount) {
							register.$deep.trigger();
						}
						// watching
						register.$deep.watch.forEach((watch: Watch) => {
							let find = watch.dependencies.find((item: string) => item === `ctx.${name}.${b}`);
							if (find) {
								watch.handle(b, c);
							}
						});
					});
					return true;
				},
			}
		);
	}
	// for state
	else {
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
		component[name] = new Proxy(
			{ ...initial, _isProxy: true },
			{
				set(a, b, c) {
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
			}
		);
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
	let values = state(entry, defaultContext, null, registery);
	return (component) => {
		if (action) {
			if (!component.$deep.dispatch) {
				component.$deep.dispatch = {};
			}
			component.$deep.dispatch[entry] = action;
		}
		registery.push(component);
		component.ctx[entry] = values;
	};
};

/**
 * @watch
 * watching a state or props on component
 */
export const watch = function (dependencies: string[], handle: Function, component: Component) {
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
export const mount = (callback: Function, component: Component) => {
	let data: Mount = {
		run: false,
		handle(defineConfig: any = {}, update: boolean = false) {
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
export const layout = (callback: Function, component: Component) => {
	if (!component.$deep.layout) {
		component.$deep.layout = [];
	}
	component.$deep.layout.push(callback);
	return true;
};

/**
 * @created
 * lifecycle methods on created component
 */
export const created = (callback: Function, component: Component) => {
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
export const beforeUpdate = (callback: Function, component: Component) => {
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
export const updated = (callback: Function, component: Component) => {
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
export const batch = async (callback: Function, component: Component) => {
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
export const computed = (callback: any, component: Component) => {
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
