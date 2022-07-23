import _ from "lodash";
import { unmountCall } from "./core";
import { log } from "./utils";
import { Component } from "./blaze.d";

/**
 * @diff
 * diff attribute, skip, textNode, input element
 * update refs
 */
const diff = function (prev: HTMLElement, el: HTMLElement, component: Component) {
	let batch = [];
	if (!prev || !el) {
		return batch;
	}
	if (prev.nodeName !== el.nodeName) {
		batch.push(() => prev.replaceWith(el));
		return batch;
	}
	if (!prev || ((prev.d || el.d) && !(el instanceof SVGElement)) || prev.nodeName === '#document-fragment') {
		return batch;
	}
	// different component in same node
	if (
		prev.$name && el.$name && prev.$name !== el.$name
	) {
		let name = prev.$name;
		let key = prev.key;

		prev.$root.$deep.registry.forEach((registry) => {
			if (registry.component.constructor.name === name && registry.key === key) {
				unmountCall(registry.component.$deep);
				registry.component.$deep.mount = registry.component.$deep.mount.map((item) => {
					item.run = false;
					return item;
				});
				registry.component.$deep.hasMount = false;
				registry.component.$deep.disableAddUnmount = true;
				return registry;
			}
		});
		batch.push(() => {
			prev.$name = el.$name;
			prev.key = el.key || 0;
			prev.replaceChildren(...Array.from(el.children));
		});
		return batch;
	}
	// text/button/link
	if (["SPAN", "P", "H1", "H2", "H3", "H4", "H5", "H6", "A", "BUTTON"].includes(prev.nodeName)) {
		let run = false;
		const rechange = (node, i) => {
			if (node && el.childNodes[i] !== undefined) {
				if (node.data && node.data !== el.childNodes[i].data) {
					batch.push(() => {
						log("[text]", node.data, ">", el.childNodes[i].data);
						node.replaceData(0, -1, el.childNodes[i].data);
					});
				}
			}
		};
		// same length
		if (prev.childNodes.length === el.childNodes.length) {
			prev.childNodes.forEach((node: any, i: number) => {
				if (node.data !== el.childNodes[i].data) {
					run = true;
					node.data = el.childNodes[i].data;
				}
			});
		}

		if (!run) {
			// prev < el
			if (prev.childNodes.length < el.childNodes.length) {
				prev.childNodes.forEach((node: any, i: number) => {
					if (node.data !== prev.childNodes[i].data) {
						run = true;
						node.data = el.childNodes[i].data;
					}
					if(i === prev.childNodes.length - 1) {
						run = true;
						batch.push(() => {
							el.childNodes.forEach((nodes: HTMLElement, key: number) => {
								if(key > i) {
									prev.appendChild(nodes);
								}
							});
						});
					}
				});
			}

			// prev > el
			if (prev.childNodes.length > el.childNodes.length) {
				prev.childNodes.forEach((node: any, i: number) => {
					if(!el.childNodes[i]) {
						run = true;
						return node.remove()
					}
					if (node.data !== el.childNodes[i].data) {
						run = true;
						node.data = el.childNodes[i].data;
					}
				});
			}

			// 0 && >= 1
			if (!prev.childNodes.length && el.childNodes.length) {
				batch.push(() => {
					el.childNodes.forEach((node: HTMLElement) => {
						prev.appendChild(node);
					});
				});
			} else {
				prev.childNodes.forEach((node: any, i: number) => {
					rechange(node, i);
				});
			}
		}
	}
	// attribute
	if (prev.attributes.length) {
		batch.push(() => {
			for (var i = 0; i < prev.attributes.length; i++) {
				if (prev.attributes[i] && el.attributes[i] && prev.attributes[i].name === el.attributes[i].name) {
					if (prev.attributes[i].value !== el.attributes[i].value) {
						log("[different]", prev.attributes[i].value, el.attributes[i].value);
						prev.attributes[i].value = el.attributes[i].value;
					}
				}
			}
		});
	}
	// update refs if updated
	if (prev.refs) {
		let isConnected = prev.isConnected ? prev : el;
		if (typeof prev.i === "number") {
			if (!component[prev.refs[prev.i]]) {
				component[prev.refs[prev.i]] = [];
			}
			component[prev.refs][prev.i] = isConnected;
		} else {
			component[prev.refs] = isConnected;
		}
	}
	// input
	if (prev.value !== el.value) {
		batch.push(() => (prev.value = el.value));
	}

	return batch;
};

/**
 * @diffChildren
 * diffing children component
 * replaceChildren if old el with new el is different
 * skip diff if el not different with current component
 * and diff element
 */
export const diffChildren = (oldest: any, newest: any, component: Component, first: boolean = true) => {
	if (!newest) {
		return;
	}
	if (oldest.for) {
		// replacing if oldest.children === 0
		if (!oldest.children.length && newest.children.length) {
			oldest.replaceChildren(...newest.children);
			return;
		} else if (oldest.children.length && newest.children.length === 0) {
			Array.from(oldest.children).forEach((item: HTMLElement) => {
				removeComponentOrEl(item, component);
			});
			return;
		}
		// not exists, auto delete...
		else if (newest.children.length < oldest.children.length) {
			Array.from(oldest.children).forEach((item: HTMLElement) => {
				let latest = Array.from(newest.children).find((el: HTMLElement) => el.key === item.key);
				if (!latest) {
					removeComponentOrEl(item, component);
					return;
				}
			});
			nextDiffChildren(Array.from(oldest.children), newest, component);
			return;
		}
		// new children detection
		else if (newest.children.length > oldest.children.length) {
			// oldest.for = newest.for;
			Array.from(newest.children).forEach((item: HTMLElement, i: number) => {
				let latest = Array.from(oldest.children).find((el: HTMLElement) => el.key === item.key);
				if (!latest) {
					let check = oldest.children[i];
					if (check) {
						check.insertAdjacentElement("beforebegin", item);
					} else {
						oldest.children[i - 1].insertAdjacentElement("afterend", item);
					}
					return;
				}
			});
			nextDiffChildren(Array.from(oldest.children), newest, component);
			return;
		}
		// same length children
		else {
			// updating data in children
			nextDiffChildren(Array.from(oldest.children), newest, component);
			return;
		}
	}
	if (_.isBoolean(oldest.show)) {
		if (!newest.show) {
			oldest.remove();
			return;
		}
	}

	if ((oldest.$name || newest.$name) !== component.constructor.name) {
		return;
	}
	if (oldest.children.length !== newest.children.length) {
		// checking element is component and exists in node or not
		// if not exists, call remove component
		if (component.$deep.checking) {
			setTimeout(() => {
				let nonactive = component.$deep.checking.filter((item) => item.$node.isConnected === false);
				nonactive.forEach((item) => {
					if (!item.$deep.active) {
						item.$deep.active = true;
						item.$deep.remove(true);
					} else {
						item.$deep.active = false;
					}
				});
			}, 0);
		}
		_.forEach(newest.children, (data, i) => {
			if (data.$children) {
				if (data.$children.$deep.hasMount) {
					data.$children.$deep.hasMount = false;
					data.$children.$deep.mount = data.$children.$deep.mount.map((item) => {
						item.run = false;
						return item;
					});
					data.$children.$deep.disableAddUnmount = true;
					if (!data.parentElement.$checking) {
						data.parentElement.$checking = [];
					}
					data.parentElement.$checking.push(data.$children);
				}
			}
			if (data.parentElement.$checking && i === newest.children.length - 1) {
				component.$deep.checking = data.parentElement.$checking;
			}
		});
		return oldest.replaceChildren(...newest.children);
	} else {
		if (first) {
			let difference = diff(oldest, newest, component);
			difference.forEach((rechange: Function) => rechange());
		}
		nextDiffChildren(Array.from(oldest.children), newest, component);
	}
};

function nextDiffChildren(children: HTMLElement[], newest: any, component: Component) {
	children.forEach((item: HTMLElement, i: number) => {
		let difference = diff(item, newest.children[i], component);
		difference.forEach((rechange: Function) => rechange());
		diffChildren(item, newest.children[i], component, false);
	});
}

function removeComponentOrEl(item: HTMLElement, component: Component) {
	if (item.$children) {
		let check = component.$deep.registry.find(
			(registry) =>
				registry.component.constructor.name === item.$children.constructor.name &&
				registry.key === item.key
		);
		if (check) {
			check.component.$deep.remove();
			component.$deep.registry = component.$deep.registry.filter(
				(registry) =>
					!(
						registry.component.constructor.name === item.$children.constructor.name &&
						registry.key === item.key
					)
			);
		} else {
			item.remove();
		}
	} else {
		item.remove();
	}
}
export default diff;
