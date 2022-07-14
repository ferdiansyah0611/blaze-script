import { log } from "./utils";
import { e } from "./blaze";
import { Component } from "./blaze.d";
import { diffChildren } from "./diff";

/**
 * @init
 * setup/initialize a component
 */
export const init = (component: Component) => {
	if (!component.$deep) {
		component.$deep = {
			$id: 1,
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
				let newRender = component.render();
				diffChildren(component.$node, newRender, component);
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
			},
		};

		component.ctx = {};
		component.props = {};
		component.$h = jsx(component);
	}
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
		// logic
		if (item === "if") {
			log("[if]", data[item]);
			let handle = () => {
				let currentEl = el;
				let applyChildren = () => {
					if (!currentEl.childrenCommit) {
						currentEl.childrenCommit = Array.from(currentEl.children);
					}
				};

				if (currentEl) {
					if (data[item] === true) {
						if (!currentEl.hasAppend && currentEl.childrenCommit) {
							currentEl.childrenCommit.forEach((item: HTMLElement) => currentEl.appendChild(item));
						}
						currentEl.if = true;
						currentEl.hasAppend = true;
						applyChildren();
					} else {
						currentEl.if = false;
						currentEl.hasAppend = false;
						applyChildren();
						Array.from(currentEl.children).forEach((item: HTMLElement) => item.remove());
					}
				}
			};
			handle();
			return;
		}
		if (item === "else") {
			let handle = () => {
				let currentEl = el;
				let applyChildren = () => {
					if (!currentEl.childrenCommit) {
						currentEl.childrenCommit = Array.from(currentEl.children);
					}
				};

				if (currentEl && currentEl.previousSibling) {
					if (currentEl.previousSibling.if === false) {
						if (!currentEl.hasAppend && currentEl.childrenCommit) {
							currentEl.childrenCommit.forEach((item) => currentEl.appendChild(item));
						}
						currentEl.if = true;
						currentEl.hasAppend = true;
						applyChildren();
					} else {
						currentEl.if = false;
						currentEl.hasAppend = false;
						applyChildren();
						Array.from(currentEl.children).forEach((item: HTMLElement) => item.remove());
					}
				}
			};
			handle();
			return;
		}
		if (item.match(/^data-/)) {
			let name = item.split("data-")[1];
			el.dataset[name] = data[item];
			return;
		}
		if (item === "refs" && !component.$deep.update) {
			if (typeof data.i === "number") {
				if(!component[data[item]]) {
					component[data[item]] = [];
				}
				component[data[item]][data.i] = el;
			} else {
				component[data[item]] = el;
			}
			// don't return
		}
		if (item === "class") {
			el.className = data[item];
			return;
		}
		if (item === "setHTML" && data[item]) {
			el.innerHTML = data[item];
			return;
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
		$deep.mount.forEach((item) => item.handle(props, update));
		$deep.hasMount = true;
	}
};

/**
 * @unmountCall
 * for run unmount lifecycle
 */
export const unmountCall = ($deep: Component["$deep"]) => {
	$deep.unmount.forEach((item) => item());
};

/**
 * @layoutCall
 * for run layout lifecycle
 */
export const layoutCall = ($deep: Component["$deep"]) => {
	if ($deep.layout) $deep.layout.forEach((item) => item());
};
