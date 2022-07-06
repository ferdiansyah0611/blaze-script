import { log } from "./utils";
import { e } from "./blaze";
import { Component } from "./blaze.d";

// setup
export const init = (component: Component) => {
	if (!component.$deep) {
		component.$deep = {
			update: 0,
			batch: false,
			node: [],
			registry: [],
			watch: [],
			mount: [],
			unmount: [],
			trigger: () => {
				component.$deep.update++;
				component.$deep.$id = 1;
				component.render();
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
		h: (...arg) => {
			return e(false, component, ...arg);
		},
		Fragment: "Fragment",
	};
};

export const getPreviousUtilites = (
	first: boolean,
	$deep: Component.$deep,
	el: HTMLElement
) => {
	if ($deep.update) {
		if (first) {
			return $deep.node[$deep.node.length - 1]?.el;
		}
		return $deep.node[$deep.$id - 1]?.el;
	} else {
		return el;
	}
};

export const childrenUtilites = (
	children: HTMLElement[],
	el: HTMLElement,
	$deep: Component.$deep,
	current: HTMLElement
) => {
	if (children.length === 1 && typeof children[0] === "string") {
		el.append(document.createTextNode(children[0]));
	} else if (children.length) {
		children.forEach((item) => {
			// node
			if (item && item.nodeName) {
				if (!$deep.update) {
					log("[appendChild]", item.tagName);
					el.appendChild(item);
					return;
				}
			}
			// string/number
			if (["string", "number"].includes(typeof item)) {
				el.append(document.createTextNode(item.toString()));
				return;
			}
			if (Array.isArray(item)) {
				let key = 0;
				for (const subchildren of item) {
					if (!$deep.update) {
						subchildren.key = key;
						key++;
						current.appendChild(subchildren);
					}
					// update children
					// else {
					// 	let find = Array.from(current.childNodes).find(element => (element.key) === key)
					// 	console.log(find.isEqualNode(subchildren))
					// 	key++
					// }
				}
			}
		});
	}
};

export const attributeUtilites = (
	first: boolean,
	data: any,
	el: HTMLElement,
	$deep: Component.$deep,
	component: Component,
	current: HTMLElement
) => {
	Object.keys(data).forEach((item) => {
		// event
		if (item.match(/^on[A-Z]/)) {
			if (typeof data[item] === "function") {
				let find = item.match(/Prevent|StopPropagation|Value/);
				if (find) {
					let isValue = find[0] === "Value";
					el.addEventListener(
						item.split(find[0]).join("").toLowerCase().slice(2),
						(e) => {
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
		}
		// logic
		if (item === "if") {
			log("[if]", data[item]);

			let find = $deep.node.find((item) => item.key === $deep.$id) || {};
			if (!find) {
				$deep.node.push({
					key: $deep.$id,
					el: current,
				});
				log("[if > current]", current);
			}
			let handle = () => {
				let currentEl = find.el || current;
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
						Array.from(currentEl.children).forEach((item) =>
							item.remove()
						);
					}
				}
			};
			handle();
		}
		if (item === "else") {
			let find = $deep.node.find((item) => item.key === $deep.$id) || {};
			if (!find) {
				$deep.node.push({
					key: $deep.$id,
					el: current,
				});
			}
			let handle = () => {
				let currentEl = find.el || current;
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
						Array.from(currentEl.children).forEach((item) =>
							item.remove()
						);
					}
				}
			};
			handle();
		}
		if (item.match(/^data-/)) {
			let name = item.split("data-")[1];
			el.dataset[name] = data[item];
			delete data[item.match(/^data-\S+/)[0]];
		}
		if (item === "refs") {
			if (typeof data.i === "number") {
				component[data[item]][data.i] =
					$deep.node[$deep.$id - 1] || current;
			} else {
				component[data[item]] = $deep.node[$deep.$id - 1] || current;
			}
		}
		el[item] = data[item];
	});
};

export const mountUtilities = (
	$deep: Component.$deep,
	props: any = {},
	update: boolean = false
) => {
	$deep.mount.forEach((item) => item.handle(props, update));
};
export const unmountUtilities = ($deep: Component.$deep) => {
	$deep.unmount.forEach((item) => item());
};
