import { log } from "./utils";
import { e } from "./blaze";
import { Component } from "./blaze.d";
import { diffChildren } from './diff';

// setup
export const init = (component: Component) => {
	if (!component.$deep) {
		component.$deep = {
			$id: 1,
			update: 0,
			batch: false,
			disableTrigger: false,
			hasMount: false,
			updateArray: false,
			node: [],
			registry: [],
			watch: [],
			mount: [],
			unmount: [],
			trigger: () => {
				component.$deep.updateArray = true;
				component.$deep.update++;
				// diff in here
				let newRender = component.render();
				diffChildren(component.$node, newRender)
			},
			remove() {
				this.registry.forEach((item) => {
					item.component.$deep.remove();
				});
				unmountUtilities(this);
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
export const jsx = (component: Component) => {
	return {
		h: (nodeName: string | Function | any, data: any, ...children: any[]) => {
			return e(false, component, nodeName, data, ...children);
		},
		Fragment: "Fragment",
	};
};

export const getPreviousUtilites = (
	first: boolean,
	$deep: Component["$deep"],
	component: Component,
	el: HTMLElement
) => {
	if ($deep.update) {
		if (first) {
			return component.$node;
			// return $deep.node[$deep.node.length - 1]?.el;
		}
		return $deep.node[$deep.$id - 1]?.el;
	} else {
		return el;
	}
};

export const childrenUtilites = (
	children: HTMLElement[],
	el: HTMLElement,
	$deep: Component["$deep"],
) => {
	if (children.length === 1 && typeof children[0] === "string") {
		el.append(document.createTextNode(children[0]));
	} else if (children.length) {
		// log('[children]', children)
		children.forEach((item) => {
			// node
			if (item && item.nodeName && (!$deep.update || $deep.updateArray)) {
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
					subchildren.key = key;
					key++;
					el.appendChild(subchildren);
				}
			}
		});
	}
};

export const attributeUtilites = (
	data: any,
	el: HTMLElement,
	component: Component,
	current: HTMLElement
) => {
	Object.keys(data).forEach((item: any) => {
		// event
		if (item.match(/^on[A-Z]/)) {
			if (typeof data[item] === "function") {
				let find = item.match(/Prevent|StopPropagation|Value/);
				if (find) {
					let isValue = find[0] === "Value";
					el.addEventListener(
						item.split(find[0]).join("").toLowerCase().slice(2),
						(e: any) => {
							e.preventDefault();
							data[item](isValue ? e.target.value : e);
						}
					);
				} else {
					el.addEventListener(
						item.toLowerCase().slice(2),
						data[item]
					);
				}
			}
			delete data[item.match(/^on[A-Z][a-z]+/)[0]];
			return
		}
		// logic
		if (item === "if") {
			log("[if]", data[item]);
			let handle = () => {
				let currentEl = el;
				let applyChildren = () => {
					if (!currentEl.childrenCommit) {
						currentEl.childrenCommit = Array.from(
							currentEl.children
						);
					}
				};

				if (currentEl) {
					if (data[item] === true) {
						if (!currentEl.hasAppend && currentEl.childrenCommit) {
							currentEl.childrenCommit.forEach((item: HTMLElement) =>
								currentEl.appendChild(item)
							);
						}
						currentEl.if = true;
						currentEl.hasAppend = true;
						applyChildren();
					} else {
						currentEl.if = false;
						currentEl.hasAppend = false;
						applyChildren();
						Array.from(currentEl.children).forEach((item: HTMLElement) =>
							item.remove()
						);
					}
				}
			};
			handle();
			return
		}
		if (item === "else") {
			let handle = () => {
				let currentEl = el;
				let applyChildren = () => {
					if (!currentEl.childrenCommit) {
						currentEl.childrenCommit = Array.from(
							currentEl.children
						);
					}
				};

				if (currentEl && currentEl.previousSibling) {
					if (currentEl.previousSibling.if === false) {
						if (!currentEl.hasAppend && currentEl.childrenCommit) {
							currentEl.childrenCommit.forEach((item) =>
								currentEl.appendChild(item)
							);
						}
						currentEl.if = true;
						currentEl.hasAppend = true;
						applyChildren();
					} else {
						currentEl.if = false;
						currentEl.hasAppend = false;
						applyChildren();
						Array.from(currentEl.children).forEach((item: HTMLElement) =>
							item.remove()
						);
					}
				}
			};
			handle();
			return
		}
		if (item.match(/^data-/)) {
			let name = item.split("data-")[1];
			el.dataset[name] = data[item];
			delete data[item.match(/^data-\S+/)[0]];
			return;
		}
		if (item === "refs") {
			if (typeof data.i === "number") {
				component[data[item]][data.i] = current || el;
			} else {
				component[data[item]] = current || el;
			}
			return;
		}
		if(item === 'class') {
			el.className = data[item];
			delete item.class;
			return;
		}
		el[item] = data[item];
	});
};

export const mountUtilities = (
	$deep: Component["$deep"],
	props: any = {},
	update: boolean = false
) => {
	if(!$deep.hasMount) {
		$deep.mount.forEach((item) => item.handle(props, update));
		$deep.hasMount = true;
	}
};
export const unmountUtilities = ($deep: Component["$deep"]) => {
	$deep.unmount.forEach((item) => item());
};
