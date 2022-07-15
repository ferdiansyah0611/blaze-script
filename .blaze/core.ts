import { log } from "./utils";
import { e } from "./blaze";
import { Component, Mount } from "./blaze.d";
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
			let value;
			let split = path.split(".");

			let deepObjectState = (isValue?: any) => {
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
					if(data.trigger === 0 && data.trigger !== undefined) {
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

					if(data.trigger === 0 && data.trigger !== undefined) {
						component.$deep.disableTrigger = false;
					}
					if(data.trigger) {
						component.$deep.trigger();
					}
				}
				return value;
			};
			el.addEventListener("change", (e: any) => {
				deepObjectState(e.target.value);
			});
			el.value = deepObjectState();
			return;
		}
		// class
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
