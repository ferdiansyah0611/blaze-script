import { getBlaze } from "./utils";
import {
	e,
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
} from "./blaze";
import { Component, Mount } from "./blaze.d";
import { diffChildren } from "./diff";
import { addLog } from "@root/plugin/extension";

/**
 * @init
 * setup/initialize a component
 */
export const init = (component: Component) => {
	if (!component.$deep) {
		component.$deep = {
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
				mountCall(component.$deep, update ? component.props : {}, update);
				component.$deep.registry.forEach((item) => {
					item.component.$deep.mounted();
				});
			},
			remove: (notClear = false) => {
				component.$deep.registry.forEach((item) => {
					item.component.$deep.remove();
				});
				unmountCall(component.$deep);

				if (component.$node) {
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

		component.ctx = {};
		component.props = {};
		component.$h = jsx(component);
	}

	return {
		dispatch: (name: string, data: any) => dispatch(name, component, data),
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
 * @mountCall
 * for run mount lifecycle
 */
export const mountCall = ($deep: Component["$deep"], props: any = {}, update: boolean = false) => {
	if (!$deep.hasMount) {
		$deep.mount.forEach((item: Mount) => item.handle(props, update));
		$deep.hasMount = true;
	}
};

/**
 * @unmountCall
 * for run unmount lifecycle
 */
export const unmountCall = ($deep: Component["$deep"]) => {
	$deep.unmount.forEach((item: Function) => item());
};

/**
 * @layoutCall
 * for run layout lifecycle
 */
export const layoutCall = ($deep: Component["$deep"]) => {
	if ($deep.layout) $deep.layout.forEach((item: Function) => item());
};

/**
 * @beforeCreateCall
 * for run before update data lifecycle
 */
export const beforeCreateCall = ($deep: Component["$deep"]) => {
	if ($deep.beforeCreate) $deep.beforeCreate.forEach((item: Function) => item());
};

/**
 * @createdCall
 * for run created lifecycle
 */
export const createdCall = ($deep: Component["$deep"]) => {
	if ($deep.created) $deep.created.forEach((item: Function) => item());
};

/**
 * @beforeUpdateCall
 * for run before update data lifecycle
 */
export const beforeUpdateCall = ($deep: Component["$deep"]) => {
	if ($deep.beforeUpdate) $deep.beforeUpdate.forEach((item: Function) => item());
};

/**
 * @updatedCall
 * for run before update data lifecycle
 */
export const updatedCall = ($deep: Component["$deep"]) => {
	if ($deep.updated) $deep.updated.forEach((item: Function) => item());
};

/**
 * @deepObjectState
 * get value state/context with dot
 */
export const deepObjectState = (path: string, data: any, component: Component, isValue?: any) => {
	let value;
	let split = path.split(".");

	if (!(typeof isValue === "string")) {
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
	withWarn: boolean,
	data: any,
	key: number,
	nodeName: string | any,
	children: HTMLElement[],
	root?: Component
) => {
	let old, now, duration, msg, warn, render;

	const renderComponent = () => {
		render = component.render();
		render.key = data.key || key;
		render.$children = component;
		render.$root = root;
		if (render.dataset) {
			render.dataset.n = nodeName.name;
			if (['number', 'string'].includes(typeof data.key)) {
				render.dataset.i = data.key;
			}
		}
	};

	// beforeCreate effect
	if (first) {
		old = performance.now();
		beforeCreateCall(component.$deep);
		createdCall(component.$deep);
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
		getBlaze(component.$config?.key || 0).runEveryMakeComponent(component);
		// warning
		if (!data.key && withWarn && !component.$node.isConnected) {
			warn = `[${nodeName.name}] key is 0. it's work, but add key property if have more on this component.`;
			console.warn(warn);
		}
		// timer
		now = performance.now();
		duration = (now - old).toFixed(1);
		msg = `[${nodeName.name}] ${duration}ms`;
		component.$deep.time = duration;
		// extension
		if (window.$extension && !component.disableExtension) {
			batch(() => {
				addLog(
					{
						msg,
					},
					false
				);
				if (warn) {
					addLog(
						{
							msg: warn,
							type: "warn",
						},
						false
					);
				}
			}, window.$extension);
		}
	}

	/**
	 * @render
	 * first rendering and call lifecycle function in fragment/first element
	 */
	if (!component.$deep.update) {
		if (first) {
			if (component.$node.isConnected) {
				// mountCall(component.$deep, data, true);
			}
			layoutCall(component.$deep);
		}
	} else {
		/**
		 * @updateRender
		 * update element on props/state change and call lifecycle function
		 */

		const current = component.$node;
		if (current) {
			layoutCall(component.$deep);
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

	if (first) return component.$node;
	return render;
};

/**
 * @removeComponentOrEl
 * remove a subcomponent or element
 */
export const removeComponentOrEl = function (item: HTMLElement, component: Component) {
	if (item.$children) {
		component.$deep.registry = component.$deep.registry.filter((registry) => {
			if (
				!(registry.component.constructor.name === item.$children.constructor.name && registry.key === item.key)
			) {
				return registry
			} else {
				registry.component.$deep.remove();
				return false;
			}
		});
	} else {
		item.remove();
	}
};

export const unmountAndRemoveRegistry = (current: Component, key: number, component: Component) => {
	if (component) {
		component.$deep.registry = component.$deep.registry.filter((registry) => {
			if (!(registry.component.constructor.name === current.constructor.name && registry.key === key)) {
				return registry;
			} else {
				unmountCall(registry.component.$deep);
				return false;
			}
		});
	}
};

export const mountComponentFromEl = (el: HTMLElement) => {
	if (el.$children) {
		el.$children.$deep.mounted();
	}
};

export const findComponentNode = (parent: HTMLElement, item: HTMLElement) => {
	return parent.querySelector(`[data-n="${item.$name}"][data-i="${item.key}"]`);
};
