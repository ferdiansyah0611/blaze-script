import _ from "lodash";
import {escape} from 'html-escaper';
import { log, getBlaze } from "./utils";
import { e, mount, layout, dispatch, render, batch, state, watch, created, beforeUpdate, updated } from "./blaze";
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
			node: [],
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
					{},
					component.props.key || 0,
					component.constructor,
					component.children
				);
				diffChildren(component.$node, result, component);
				return result;
			},
			remove(notClear = false) {
				this.registry.forEach((item) => {
					item.component.$deep.remove();
				});
				unmountCall(component.$deep);
				component.$node.remove();

				if (!notClear) {
					this.node = [];
					this.registry = [];
					this.watch = [];
					this.mount = [];
					this.unmount = [];
					this.layout = [];
				}
			},
		};

		component.ctx = {};
		component.props = {};
		component.$h = jsx(component);
	}

	return {
		mount: (callback: Function) => mount(callback, component),
		layout: (callback: Function) => layout(callback, component),
		dispatch: (name: string, data: any) => dispatch(name, component, data),
		render: (callback: Function) => render(callback, component),
		batch: (callback: Function) => batch(callback, component),
		state: (...argv: any[]) => state.apply(null, [...argv, component]),
		watch: (...argv: any[]) => watch.apply(null, [...argv, component]),
		created: (callback) => created(callback, component),
		beforeUpdate: (callback) => beforeUpdate(callback, component),
		updated: (callback) => updated(callback, component),
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
 * @childrenObserve
 * manage children element, like appendChild a node/string/number
 */
export const childrenObserve = (children: HTMLElement[], el: HTMLElement) => {
	if (children.length === 1 && typeof children[0] === "string") {
		el.append(document.createTextNode(children[0]));
	} else if (children.length) {
		children.forEach((item, i) => {
			// logic
			if(item.hasOwnProperty('if') && !item.if) {
				return;
			}
			if(item.else) {
				let previous = Array.from(children)[i - 1];
				if(previous.hasOwnProperty('if') && previous.if) {
					return;
				}
			}
			// node
			if (item && item.nodeName) {
				log("[appendChild]", item.tagName);
				el.appendChild(item);
				return;
			}
			// string/number
			if (["string", "number"].includes(typeof item)) {
				el.append(document.createTextNode(item.toString()));
				return;
			}
			if (Array.isArray(item)) {
				let key = 0;
				for (const subchildren of item) {
					if (subchildren) {
						subchildren.key = key;
						key++;
						el.appendChild(subchildren);
					}
				}
			}
		});
	}
};

/**
 * @attributeObserve
 * manage attribute element, like dataset, event, etc
 */
export const attributeObserve = (data: any, el: HTMLElement, component: Component) => {
	Object.keys(data).forEach((item: any) => {
		if (item === "model") {
			let path = data[item];
			el.addEventListener("change", (e: any) => {
				deepObjectState(path, data, component, e.target.value);
			});
			el.value = deepObjectState(path, data, component);
			return;
		}
		// class
		if (item.match(/class|className/g) && Array.isArray(data[item])) {
			el.className = data[item].join(" ");
			return;
		}
		if (item === "class") {
			el.className = data[item];
			return;
		}
		// style object
		if (item === "style" && typeof data[item] === "object") {
			for (let [name, value] of Object.entries(data[item])) {
				if (typeof value === "number") {
					value = value + "px";
				}
				el.style[name] = value;
			}
			return;
		}
		// dataset
		if (item.match(/^data-/)) {
			let name = item.split("data-")[1];
			el.dataset[name] = data[item];
			return;
		}
		// refs
		if (item === "refs" && !component.$deep.update) {
			if (typeof data.i === "number") {
				if (!component[data[item]]) {
					component[data[item]] = [];
				}
				component[data[item]][data.i] = el;
			} else {
				component[data[item]] = el;
			}
			// don't return
		}
		// setHTML
		if (item === "setHTML" && data[item]) {
			el.innerHTML = escape(data[item]);
			return;
		}
		// event
		if (item.match(/^on[A-Z]/)) {
			if (typeof data[item] === "function") {
				let find = item.match(/Prevent|StopPropagation|Value/);
				if (find) {
					let isValue = find[0] === "Value";
					el.addEventListener(item.split(find[0]).join("").toLowerCase().slice(2), async (e: any) => {
						e.preventDefault();
						if (!data.batch) {
							await data[item](isValue ? e.target.value : e);
						} else {
							batch(async() => await data[item](isValue ? e.target.value : e), component);
						}
					});
				} else {
					el.addEventListener(item.toLowerCase().slice(2), async (e) => {
						if (!data.batch) {
							await data[item](e)
						} else {
							batch(async() => await data[item](e), component);
						}
					});
				}
			}
			return;
		}
		// magic
		if (item === "toggle") {
			el.addEventListener("click", (e: any) => {
				e.preventDefault();
				if (data.toggle.indexOf("component.") === -1) {
					data.toggle = "component." + data.toggle;
					data.toggle += " = !" + data.toggle;
				}
				eval(data.toggle);
			});
		}
		if (item === "show") {
			if (!data[item]) {
				el.style.display = "none";
				if (el.children.length) {
					_.forEach(el.children, (value) => {
						value.remove();
					});
				} else {
					_.forEach(el.childNodes, (value) => {
						value.remove();
					});
				}
			}
		}
		el[item] = data[item];
	});
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
	config?: any,
	root?: Component
) => {
	component.children = children ? children[0] : false;
	let old, now, duration, msg, warn;

	if (first) {
		old = performance.now();
		createdCall(component.$deep);
	}

	let render = component.render();
	// render.dataset.key = key;
	render.$children = component;
	render.$root = root;

	if (first) {
		component.children = children ? children[0] : false;
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
		if (!config || (config && !config.disableMount)) mountCall(component.$deep, {}, true);
		// timer
		now = performance.now();
		duration = (now - old).toFixed(1);
		msg = `[${nodeName.name}] ${duration}ms`;
		component.$deep.time = duration;
		// extension
		if (window.$extension && !component.$deep.disableExtension) {
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
				mountCall(component.$deep, data, true);
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
			if (current.$children) {
				let dataset = current.dataset;
				let check = current.$children.$deep.registry.find(
					(item) => item.component.constructor.name === dataset.component && item.key === Number(dataset.key)
				);
				if (check && check.component.$node.isConnected) {
					mountCall(check.component.component.$deep, data, true);
				}
			}
		}
	}

	// portal component
	if(component.$portal) {
		let query = document.body.querySelector(`[data-portal="${component.$portal}"]`)
		let handle = () => {
			if(data && data.hasOwnProperty('show')) {
				if(!data.show) {
					component.$node.style.display = 'none'
				} else {
					component.$node.style.display = 'unset'
				}
			}
		}
		if (first) {
			component.$node.dataset.portal = component.$portal;
			handle()
			document.body.appendChild(component.$node)
		}
		else {
			handle();
			if(query) {
				render.dataset.portal = component.$portal;
				diffChildren(component.$node, render, component);
			}
		}
		return false;
	}
	if (first) return component.$node;
	return render;
};