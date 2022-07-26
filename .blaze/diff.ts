import _ from "lodash";
import { unmountCall, removeComponentOrEl, unmountAndRemoveRegistry, mountComponentFromEl } from "./core";
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
		// replacing if oldest.children === 0
		if (!oldest.children.length && newest.children.length) {
			oldest.replaceChildren(...newest.children);
			_.forEach(oldest.children, (node) => {
				// mount
				mountComponentFromEl(node);
			});
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
			Array.from(newest.children).forEach((item: HTMLElement, i: number) => {
				let latest = Array.from(oldest.children).find((el: HTMLElement) => el.key === item.key);
				if (!latest) {
					let check = oldest.children[i];
					if (check) {
						check.insertAdjacentElement("beforebegin", item);
					} else {
						oldest.children[i - 1].insertAdjacentElement("afterend", item);
					}

					// mount
					mountComponentFromEl(item);
					return;
				}
			});
			nextDiffChildren(Array.from(oldest.children), newest, component);
			return;
		}
		// same length children
		else {
			// updating data in children
			let children: HTMLElement[] = Array.from(oldest.children);
			// if component
			if (children.length && children[0].dataset.n) {
				let latest: HTMLElement[] = Array.from(newest.children);
				_.forEach(children, (node: HTMLElement, i: number) => {
					if (latest[i] && node.key !== latest[i].key) {
						unmountAndRemoveRegistry(node.$children, node.key, node.$root);
						node.replaceWith(latest[i]);
						// mount
						mountComponentFromEl(latest[i]);
					} else {
						if (node.updating) {
							node.updating = false;
							let difference = diff(node, latest[i], node.$children);
							let childrenCurrent: any = Array.from(node.children);
							difference.forEach((rechange: Function) => rechange());
							nextDiffChildren(childrenCurrent, latest[i], node.$children);
						}
					}
				});
			} else {
				nextDiffChildren(children, newest, component);
			}
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
		let latestChildren = Array.from(newest.children);
		let insert;
		if (!oldest.children.length && newest.children.length) {
			oldest.replaceChildren(...newest.children);
			_.forEach(oldest.children, (node) => {
				// mount
				mountComponentFromEl(node);
			});
			return;
		} else if (oldest.children.length && !newest.children.length) {
			_.forEach(oldest.children, (node) => {
				// unmount
				unmountAndRemoveRegistry(node.$children, node.key, node.$root);
			});
			oldest.replaceChildren(...newest.children);
			return;
		} else if (newest.children.length < oldest.children.length) {
			log("[different] newest < oldest");
			_.forEach(Array.from(oldest.children), (node) => {
				if (_.isNumber(node.key)) {
					let latest = latestChildren.find((el: HTMLElement) => el.key === node.key);
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
			latestChildren.forEach((node: HTMLElement, i: number) => {
				if (_.isNumber(node.key)) {
					let latest = Array.from(oldest.children).find((el: HTMLElement) => el.key === node.key);
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
				oldest.replaceChildren(...latestChildren);
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
