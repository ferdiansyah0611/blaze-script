import {
	unmountCall,
	removeComponentOrEl,
	unmountAndRemoveRegistry,
	mountComponentFromEl,
	findComponentNode,
} from "./core";
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
	if (prev.key !== el.key) {
		batch.push(() => (prev.key = el.key));
	}
	if (!prev || ((prev.d || el.d) && !(el instanceof SVGElement)) || prev.nodeName === "#document-fragment") {
		return batch;
	}
	// different component in same node
	if (prev.$name && el.$name && prev.$name !== el.$name) {
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
			prev.$children = el.$children;
			prev.key = el.key || 0;
			prev.replaceChildren(...Array.from(el.children));
			mountComponentFromEl(prev);
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
					if (i === prev.childNodes.length - 1) {
						run = true;
						batch.push(() => {
							el.childNodes.forEach((nodes: HTMLElement, key: number) => {
								if (key > i) {
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
					if (!el.childNodes[i]) {
						run = true;
						return node.remove();
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
	if (!newest || !oldest) {
		return;
	}
	if (oldest.for) {
		let oldestChildren: HTMLElement[] = Array.from(oldest.children),
			newestChildren: HTMLElement[] = Array.from(newest.children),
			from = (arr) => Array.from(arr);

		if(!oldest.children.length && !newest.children.length) {
			return;
		}
		// replacing if oldest.children === 0
		else if (!oldest.children.length && newest.children.length) {
			oldest.replaceChildren(...newest.children);
			from(oldest.children).forEach((node: HTMLElement) => {
				// mount
				mountComponentFromEl(node);
			});
			return;
		} else if (oldest.children.length && newest.children.length === 0) {
			oldestChildren.forEach((item: HTMLElement) => {
				removeComponentOrEl(item, component);
			});
			return;
		}
		// not exists, auto delete...
		else if (newest.children.length < oldest.children.length) {
			oldestChildren.forEach((item: HTMLElement) => {
				let latest = findComponentNode(newest, item);
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
			let checked = false
			newestChildren.forEach((item: HTMLElement, i: number) => {
				let latest = findComponentNode(oldest, item);
				if (!latest) {
					let check = oldest.children[i];
					if (check) {
						check.insertAdjacentElement("beforebegin", item);
					} else {
						let oldChild: HTMLElement[] = Array.from(oldest.children);
						oldChild[i - 1].insertAdjacentElement("afterend", item);
					}

					// mount
					mountComponentFromEl(item);
					checked = true
					return;
				}
			});
			if(!checked) {
				nextDiffChildren(Array.from(oldest.children), newest, component);
			}
			return;
		}
		// same length children
		else {
			// updating data in children
			// if component
			if (oldestChildren.length && oldestChildren[0].dataset.n) {
				oldestChildren.forEach((node: HTMLElement, i: number) => {
					if (newestChildren[i] && node.key !== newestChildren[i].key) {
						// unmount
						unmountAndRemoveRegistry(node.$children, node.key, node.$root);
						if (node.$name !== newestChildren[i].$name) {
							node.replaceWith(newestChildren[i]);
						} else {
							node.dataset.i = newestChildren[i].key;
							node.key = newestChildren[i].key
							let difference = diff(node, newestChildren[i], node.$children);
							let childrenCurrent: any = Array.from(node.children);
							difference.forEach((rechange: Function) => rechange());
							nextDiffChildren(childrenCurrent, newestChildren[i], node.$children || component);
						}
						// mount
						mountComponentFromEl(newestChildren[i]);
					} else {
						if (node.updating) {
							node.updating = false;
							let difference = diff(node, newestChildren[i], node.$children);
							let childrenCurrent: any = Array.from(node.children);
							difference.forEach((rechange: Function) => rechange());
							nextDiffChildren(childrenCurrent, newestChildren[i], node.$children || component);
						}
					}
				});
			} else {
				nextDiffChildren(Array.from(oldest.children), newest, component);
			}
			return;
		}
	}
	if (typeof oldest.show === 'boolean') {
		if (!newest.show) {
			oldest.remove();
			return;
		}
	}

	if ((oldest.$name || newest.$name) !== component.constructor.name) {
		return;
	}
	if (oldest.children.length !== newest.children.length) {
		let oldestChildren: HTMLElement[] = Array.from(oldest.children),
			newestChildren: HTMLElement[] = Array.from(newest.children),
			insert: boolean = false;

		if (!oldest.children.length && newest.children.length) {
			oldest.replaceChildren(...newest.children);
			oldestChildren.forEach((node) => {
				// mount
				mountComponentFromEl(node);
			});
			return;
		} else if (oldest.children.length && !newest.children.length) {
			oldestChildren.forEach((node) => {
				// unmount
				unmountAndRemoveRegistry(node.$children, node.key, node.$root);
			});
			oldest.replaceChildren(...newest.children);
			return;
		} else if (newest.children.length < oldest.children.length) {
			log("[different] newest < oldest");
			oldestChildren.forEach((node) => {
				if (['number', 'string'].includes(typeof node.key)) {
					let latest = findComponentNode(newest, node);
					if (!latest) {
						// unmount
						unmountAndRemoveRegistry(node.$children, node.key, node.$root);
						insert = true;
						node.remove();
					}
				}
			});
			if (!insert) {
				oldest.replaceChildren(...newest.children);
			}
			return;
		} else if (newest.children.length > oldest.children.length) {
			log("[different] newest > oldest");
			newestChildren.forEach((node: HTMLElement, i: number) => {
				if (['number', 'string'].includes(typeof node.key)) {
					let latest = findComponentNode(oldest, node);
					if (!latest) {
						let check = oldest.children[i];
						insert = true;
						if (check) {
							check.insertAdjacentElement("beforebegin", node);
						} else {
							oldest.children[i - 1].insertAdjacentElement("afterend", node);
						}
						// mount
						mountComponentFromEl(node);
						return;
					}
				}
			});

			if (!insert) {
				oldest.replaceChildren(...newestChildren);
			}
			return;
		}
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

export default diff;
