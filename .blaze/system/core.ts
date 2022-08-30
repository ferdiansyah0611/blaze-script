import { Component, RegisteryComponent } from "../blaze.d";
import type { ConfigEntityRender, EntityCompile } from "../blaze.d";
import isEqualWith from "lodash.isequalwith";
import {
	mount,
	layout,
	dispatch,
	render,
	batch,
	state,
	watch,
	beforeCreate,
	created,
	beforeUpdate,
	updated,
	computed,
	effect,
	defineProp,
} from "./utils";
import e from "./blaze";
import { diffChildren } from "./diff";
import { addComponent } from "@root/plugin/extension";
import Lifecycle from "./lifecycle";
import { App } from "./global";

/**
 * @init
 * setup/initialize a component
 */
export const init = (component: Component, _auto?: string) => {
	if (!component.$deep) {
		let deep = {
			update: 0,
			batch: false,
			disableTrigger: false,
			hasMount: false,
			registry: [],
			watch: [],
			mount: [],
			unmount: [],
			trigger: () => {
				component.$deep.update++;
				// diff in here
				const result = rendering(
					component,
					null,
					false,
					component.props,
					component.props.key || 0,
					component.constructor,
					component.children
				);
				diffChildren(component.$node, result, component);
				return result;
			},
			mounted: (update) => {
				const lifecycle = new Lifecycle(component);
				lifecycle.mount(update ? component.props : {}, update);
				lifecycle.watch();
				lifecycle.effect(true);
				component.$deep.registry.forEach((item: RegisteryComponent) => {
					item.component.$deep.mounted(update);
				});
			},
			remove: (notClear = false, notNode = false) => {
				component.$deep.registry.forEach((item: RegisteryComponent) => {
					item.component.$deep.remove(notClear, notNode);
				});
				new Lifecycle(component).unmount();

				if (component.$node && !notNode) {
					component.$node.remove && component.$node.remove();
				}

				if (!notClear) {
					component.$deep.registry = [];
					component.$deep.watch = [];
					component.$deep.mount = [];
					component.$deep.unmount = [];
					component.$deep.layout = [];
					component.$deep.created = [];
					component.$deep.beforeCreate = [];
					component.$deep.updated = [];
					component.$deep.beforeUpdate = [];
				}
			},
		};
		let context = {};
		Object.defineProperty(component, "$deep", {
			get: () => {
				return deep;
			},
		});
		Object.defineProperty(component, "ctx", {
			get: () => {
				return context;
			},
			set: (value) => {
				if (typeof value === "object") {
					Object.assign(context, value);
				}
				return true;
			},
		});

		component.props = {};
		component.$h = jsx(component);
	}

	return {
		dispatch: (name: string, data: any, autoBatch?: boolean) => dispatch(name, component, data, autoBatch),
		render: (callback: () => any) => render(callback, component),
		batch: (callback: () => any) => batch(callback, component),
		state: (...argv: any[]) => state.apply(null, [...argv, component]),
		watch: (...argv: any[]) => watch.apply(null, [...argv, component]),
		beforeCreate: (callback: () => any) => beforeCreate(callback, component),
		created: (callback: () => any) => created(callback, component),
		mount: (callback: () => any) => mount(callback, component),
		beforeUpdate: (callback: () => any) => beforeUpdate(callback, component),
		updated: (callback: () => any) => updated(callback, component),
		computed: (data) => computed(data, component),
		layout: (callback: () => any) => layout(callback, component),
		effect: (callback: () => any) => effect(callback, component),
		defineProp: (props: any) => defineProp(props, component),
	};
};

/**
 * @jsx
 * jsx support for blaze
 */
export const jsx = (component: Component) => {
	return {
		h: (nodeName: string | Function | any, data: any, ...children: any[]) => {
			return e(component, nodeName, data, ...children);
		},
		Fragment: "Fragment",
	};
};

/**
 * @deepObjectState
 * get value state/context with dot
 */
export const deepObjectState = (path: string, data: any, component: Component, isValue?: any) => {
	let value;
	let split = path.split(".");

	if (!["string", "boolean"].includes(typeof isValue)) {
		if (split.length <= 5 && split.length > 0) {
			split.forEach((name: string, i: number) => {
				if (!i) {
					value = component[name];
				} else {
					value = value[name];
				}
			});
		}
	} else {
		if (data.trigger === 0 && data.trigger !== undefined) {
			component.$deep.disableTrigger = true;
		}

		if (split.length === 1) {
			component[split[0]] = isValue;
		}
		if (split.length === 2) {
			component[split[0]][split[1]] = isValue;
		}
		if (split.length === 3) {
			component[split[0]][split[1]][split[2]] = isValue;
		}
		if (split.length === 4) {
			component[split[0]][split[1]][split[2]][split[3]] = isValue;
		}
		if (split.length === 5) {
			component[split[0]][split[1]][split[2]][split[3]][split[4]] = isValue;
		}

		if (data.trigger === 0 && data.trigger !== undefined) {
			component.$deep.disableTrigger = false;
		}
		if (data.trigger) {
			component.$deep.trigger();
		}
	}
	return value;
};

/**
 * @rendering
 * Uitilites for rendering component
 */
export const rendering = (
	component: Component,
	$deep: Component["$deep"],
	first: boolean,
	data: any,
	key: number,
	nodeName: string | any,
	children: HTMLElement[],
	root?: Component
) => {
	let render, endPerformStartComponent;
	let blaze = getBlaze(component.$config?.key || 0);
	let error = window.$error;
	try {
		const lifecycle = new Lifecycle(component);
		const renderComponent = () => {
			render = component.render();
			render.key = data.key || key || 0;
			render.$children = component;
			render.$root = root;
			if (render.dataset) {
				render.dataset.n = nodeName.name;
				if (["number", "string"].includes(typeof (data.key || 0))) {
					render.dataset.i = data.key || 0;
				}
			}
		};

		// beforeCreate effect
		if (first) {
			endPerformStartComponent = blaze.run.onStartComponent(component);
			lifecycle.beforeCreate();
			lifecycle.created();
		}
		// call render component
		renderComponent();

		if (first) {
			component.children = children ? children : false;
			component.$node = render;
			if ($deep) {
				let index = $deep.registry.push({
					key,
					component: component,
				});
				component.$node.$index = index;
			}
			// mount
			blaze.run.onMakeComponent(component);
			blaze.run.onEndComponent(component);
			endPerformStartComponent();
		}

		/**
		 * @render
		 * first rendering and call lifecycle function in fragment/first element
		 */
		if (!component.$deep.update) {
			if (first) {
				lifecycle.layout();
			}
		} else {
			/**
			 * @updateRender
			 * update element on props/state change and call lifecycle function
			 */

			const current = component.$node;
			if (current) {
				lifecycle.layout();
			}
		}

		// portal component
		if (component.$portal && component.$node.dataset) {
			let query = document.body.querySelector(`[data-portal="${component.$portal}"]`);
			let handle = () => {
				if (data && data.hasOwnProperty("show")) {
					if (!data.show) {
						component.$node.style.display = "none";
					} else {
						component.$node.style.display = "unset";
					}
				}
			};
			if (first) {
				component.$node.dataset.portal = component.$portal;
				handle();
				document.body.appendChild(component.$node);
			} else {
				handle();
				if (query) {
					render.dataset.portal = component.$portal;
					diffChildren(component.$node, render, component);
				}
			}
			return false;
		}
	} catch (err) {
		if (error) {
			error.open(`Component ${component.constructor.name}`, err.stack);
		}
	}

	if (first) return component.$node;
	return render;
};

export const equalProps = (oldProps, newProps) => {
	return isEqualWith({ ...oldProps }, { ...newProps, _isProxy: true }, function (val1, val2): any {
		if (typeof val1 === "function" && typeof val2 === "function") {
			return val1.toString() === val2.toString();
		}
	});
};

/**
 * @EntityRender
 * utilites for render
 */
export class EntityRender {
	config: ConfigEntityRender;
	component: any;
	$before?: () => any;
	$beforeCompile?: (current: any) => any;
	constructor(component, config) {
		this.component = component;
		this.config = config;
	}
	before = (callback: (current: any) => any) => {
		this.$before = callback.bind(this);
		return this;
	};
	beforeCompile = (callback: (current: any) => any) => {
		this.$beforeCompile = callback.bind(this);
		return this;
	};
	start = () => {
		const { arg, key, inject } = this.config;
		if (this.$before) this.$before();

		if (arg) this.component = new this.component(...arg);
		else this.component = new this.component();
		// inject object to component
		if (inject) {
			Object.assign(this.component, inject);
		}
		// inject config
		let root = App.get(key || 0, "config");
		if (root) this.component.$config = root;
		return this;
	};
	done = (callback: (current: any) => any) => {
		callback.bind(this)(this);
	};
	compile(option: EntityCompile) {
		if (this.$beforeCompile) this.$beforeCompile(this);
		rendering(
			this.component,
			option.deep,
			option.first,
			option.data || {},
			option.key,
			this.component.constructor,
			option.children || []
		);
		return this;
	}
	saveToExtension() {
		addComponent(this.component);
		return this;
	}
	mount(update?: boolean) {
		this.component.$deep.mounted(update);
		return this;
	}
	remove(notClear?: boolean, notNode?: boolean) {
		this.component.$deep.remove(notClear, notNode);
		return this;
	}
	replaceChildren(entry: string) {
		const query = document.querySelector(entry);
		if (query) query.replaceChildren(this.component.$node);
		else console.error("[replaceChildren]", entry, "not detected");
		return this;
	}
	appendChild(target: HTMLElement) {
		if (target) target.appendChild(this.component.$node);
		return this;
	}
}

export const getBlaze = (key) => {
	let app = App.get(key);
	if (app) {
		return app.blaze;
	}
	return {};
};
