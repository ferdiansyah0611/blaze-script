import { log } from "./utils";
import { e, mount, layout, dispatch, render, batch, state, watch } from "./blaze";
import { Component, Mount } from "./blaze.d";
import { diffChildren } from "./diff";
import _ from "lodash";

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
			childrenDiffStatus: false,
			node: [],
			registry: [],
			watch: [],
			mount: [],
			unmount: [],
			trigger: () => {
				component.$deep.childrenDiffStatus = true;
				component.$deep.update++;
				// diff in here
				diffChildren(component.$node, component.render(), component);
			},
			remove() {
				this.registry.forEach((item) => {
					item.component.$deep.remove();
				});
				unmountCall(component.$deep);
				component.$node.remove();

				this.node = [];
				this.registry = [];
				this.watch = [];
				this.mount = [];
				this.unmount = [];
				this.layout = [];
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
	};
};

/**
 * @jsx
 * jsx support for blaze
 */
export const jsx = (component: Component) => {
	return {
		h: (nodeName: string | Function | any, data: any, ...children: any[]) => {
			return e(false, component, nodeName, data, ...children);
		},
		Fragment: "Fragment",
	};
};

/**
 * @childrenObserve
 * manage children element, like appendChild a node/string/number
 */
export const childrenObserve = (children: HTMLElement[], el: HTMLElement, $deep: Component["$deep"]) => {
	if (children.length === 1 && typeof children[0] === "string") {
		el.append(document.createTextNode(children[0]));
	} else if (children.length) {
		children.forEach((item) => {
			// node
			if (item && item.nodeName && (!$deep.update || $deep.childrenDiffStatus)) {
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
			el.innerHTML = data[item];
			return;
		}
		// event
		if (item.match(/^on[A-Z]/)) {
			if (typeof data[item] === "function") {
				let find = item.match(/Prevent|StopPropagation|Value/);
				if (find) {
					let isValue = find[0] === "Value";
					el.addEventListener(item.split(find[0]).join("").toLowerCase().slice(2), (e: any) => {
						e.preventDefault();
						data[item](isValue ? e.target.value : e);
					});
				} else {
					el.addEventListener(item.toLowerCase().slice(2), data[item]);
				}
			}
			return;
		}
		// magic
		if (item === "toggle") {
			el.addEventListener("click", (e: any) => {
				e.preventDefault();
				if(data.toggle.indexOf('component.') === -1) {
					data.toggle = 'component.' + data.toggle
					data.toggle += ' = !' + data.toggle
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
 * @deepObjectState
 * get value state/context with dot
 */

const deepObjectState = (path: string, data: any, component: Component, isValue?: any) => {
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
