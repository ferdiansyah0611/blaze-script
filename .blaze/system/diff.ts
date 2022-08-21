import { removeComponentOrEl, unmountAndRemoveRegistry, mountComponentFromEl, findComponentNode } from "./dom";
import { Component, VirtualEvent } from "../blaze.d";
import Lifecycle from "./lifecycle";
import { HMR } from "./global";

/**
 * @diff
 * diff attribute, skip, textNode, input element
 * update refs
 */
const diff = function (prev: HTMLElement, el: HTMLElement, component: Component) {
	let zip = [];
	if (!prev || !el) {
		return zip;
	}
	if (prev.nodeName !== el.nodeName) {
		zip.push(() => prev.replaceWith(el));
		return zip;
	}
	if (prev.key !== el.key) {
		zip.push(() => (prev.key = el.key));
	}
	if (!prev || ((prev.diff || el.diff) && !(el instanceof SVGElement)) || prev.nodeName === "#document-fragment") {
		return zip;
	}
	// different component in same node
	if (prev.$name && el.$name && prev.$name !== el.$name) {
		let name = prev.$name;
		let key = prev.key;

		if (prev.$root) {
			prev.$root.$deep.registry.forEach((registry) => {
				if (registry.component.constructor.name === name && registry.key === key) {
					new Lifecycle(registry.component).unmount();
					registry.component.$deep.mount = registry.component.$deep.mount.map((item) => {
						item.run = false;
						return item;
					});
					registry.component.$deep.hasMount = false;
					registry.component.$deep.disableAddUnmount = true;
					return registry;
				}
			});
		}
		zip.push(() => {
			prev.$name = el.$name;
			prev.$children = el.$children;
			prev.key = el.key || 0;
			prev.replaceChildren(...Array.from(el.children));
			mountComponentFromEl(prev);
		});
		return zip;
	}
	// text/button/link/code
	if (["SPAN", "P", "H1", "H2", "H3", "H4", "H5", "H6", "A", "BUTTON", "CODE"].includes(prev.nodeName)) {
		const rechange = (node, i) => {
			if (node && el.childNodes[i] !== undefined && node.data !== el.childNodes[i].data) {
				zip.push(() => {
					node.replaceData(0, -1, el.childNodes[i].data);
				});
			}
		};
		if (!prev.childNodes.length && el.childNodes.length) {
			el.childNodes.forEach((node: HTMLElement) => {
				prev.appendChild(node);
			});
		} else if (prev.childNodes.length && !el.childNodes.length) {
			prev.childNodes.forEach((node: HTMLElement) => {
				node.remove();
			});
		} else if (prev.childNodes.length === el.childNodes.length) {
			prev.childNodes.forEach(rechange);
		} else if (el.childNodes.length > prev.childNodes.length) {
			prev.childNodes.forEach((node: any, i: number) => {
				rechange(node, i);
				if (i === prev.childNodes.length - 1) {
					zip.push(() => {
						el.childNodes.forEach((nodes: HTMLElement, key: number) => {
							if (key > i) {
								prev.appendChild(nodes);
							}
						});
					});
				}
			});
		} else if (el.childNodes.length < prev.childNodes.length) {
			prev.childNodes.forEach((node: any, i: number) => {
				if (!el.childNodes[i]) {
					return node.remove();
				}
				rechange(node, i);
			});
		}
	}
	// attribute
	if (prev.attributes.length || el.attributes.length) {
		zip.push(() => {
			let oldAttr = prev.getAttributeNames();
			let newAttr = el.getAttributeNames();
			// !old new
			if (!oldAttr.length && newAttr.length) {
				newAttr.forEach((name) => {
					prev.setAttribute(name, el.getAttribute(name));
				});
			}
			// old !new
			else if (oldAttr.length && !newAttr.length) {
				oldAttr.forEach((name) => {
					prev.removeAttribute(name);
				});
			}
			// same
			else if (oldAttr.length === newAttr.length) {
				oldAttr.forEach((name) => {
					let oldValue = prev.getAttribute(name);
					let newValue = el.getAttribute(name);
					if (oldValue !== newValue) {
						prev.setAttribute(name, newValue);
					}
				});
			}
			// add
			else if (newAttr.length > oldAttr.length) {
				newAttr.forEach((name) => {
					let check = prev.getAttribute(name);
					if (!check) {
						prev.setAttribute(name, el.getAttribute(name));
					}
				});
			}
			// delete
			else if (newAttr.length < oldAttr.length) {
				oldAttr.forEach((name) => {
					let check = el.getAttribute(name);
					if (!check) {
						prev.removeAttribute(name);
					}
				});
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
		zip.push(() => (prev.value = el.value));
	}
	// event
	if ((prev.events || el.events) && !prev.toggle && !el.toggle && !prev.model && !el.model) {
		eventDiff(prev, el);
	}
	// toggle
	if (prev.toggle || el.toggle) {
		if (prev.toggle && !el.toggle) {
			prev.events = prev.events.filter((event) => {
				if (event.name === "click") {
					prev.removeEventListener(event.name, event.call);
					prev.toggle = "";
					return false;
				}
				return event;
			});
			eventDiff(prev, el);
		} else if (!prev.toggle && el.toggle) {
			el.events.forEach((event) => {
				if (event.name === "click") {
					prev.addEventListener(event.name, event.call);
					prev.toggle = el.toggle;

					if (!prev.events) prev.events = [];
					prev.events.push(event);
				}
			});
			eventDiff(prev, el);
		} else if (prev.toggle !== el.toggle) {
			prev.toggle = el.toggle;
			eventDiff(prev, el);
		}
	}
	// model
	if (prev.model || el.model) {
		if (prev.model && !el.model) {
			prev.events = prev.events.filter((event) => {
				if (event.call.toString().indexOf("model") !== -1 && ["keyup", "change"].includes(event.name)) {
					prev.removeEventListener(event.name, event.call);
					prev.model = "";
					return false;
				}
				return event;
			});
		} else if (!prev.model && el.model) {
			el.events.forEach((event) => {
				if (event.call.toString().indexOf("model") !== -1 && ["keyup", "change"].includes(event.name)) {
					prev.addEventListener(event.name, event.call);
					prev.model = el.model;

					if (!prev.events) prev.events = [];
					prev.events.push(event);
				}
			});
		} else if (prev.model !== el.model) {
			prev.model = el.model;
		}
	}

	return zip;
};

/**
 * @diffChildren
 * diffing children component
 * replaceChildren if old el with new el is different
 * skip diff if el not different with current component
 * and diff element
 */
export const diffChildren = (oldest: any, newest: any, component: Component, first: boolean = true) => {
	if (!newest || !oldest || oldest.skip) {
		return;
	}
	if (oldest.for) {
		let oldestChildren: HTMLElement[] = Array.from(oldest.children),
			newestChildren: HTMLElement[] = Array.from(newest.children),
			from = (arr) => Array.from(arr);

		if (!oldest.children.length && !newest.children.length) {
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
		} else if (oldest.children.length && !newest.children.length) {
			if (!HMR.get().length) {
				oldestChildren.forEach((item: HTMLElement) => {
					unmountAndRemoveRegistry(item.$children, item.key, item.$root);
				});
			}
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
			let checked = false;
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
					checked = true;
					return;
				}
			});
			if (!checked) {
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
							node.key = newestChildren[i].key;
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
	if (typeof oldest.show === "boolean") {
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
			Array.from(oldest.children).forEach((node: HTMLElement) => {
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
			oldestChildren.forEach((node) => {
				if (["number", "string"].includes(typeof node.key)) {
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
			newestChildren.forEach((node: HTMLElement, i: number) => {
				if (["number", "string"].includes(typeof node.key)) {
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

/**
 * @nextDiffChildren
 * action to next diff a children
 */
function nextDiffChildren(children: HTMLElement[], newest: any, component: Component) {
	children.forEach((item: HTMLElement, i: number) => {
		let difference = diff(item, newest.children[i], component);
		difference.forEach((rechange: Function) => rechange());
		diffChildren(item, newest.children[i], component, false);
	});
}

/**
 * @eventDiff
 * diff a event listener
 */
function eventDiff(prev: HTMLElement, el: HTMLElement) {
	if (prev.events && prev.events.length && (!el.events || !el.events.length)) {
		prev.events.forEach((event: VirtualEvent) => {
			prev.removeEventListener(event.name, event.call);
		});
		prev.events = [];
	} else if ((!prev.events || !prev.events.length) && el.events && el.events.length) {
		el.events.forEach((event: VirtualEvent) => {
			prev.addEventListener(event.name, event.call);
		});
		prev.events = el.events;
	} else if (prev.events && el.events && prev.events.length === el.events.length) {
		prev.events = prev.events.map((event: VirtualEvent, i: number) => {
			let latest = el.events[i];
			if (event.name === latest.name) {
				event = latest;
			}
			return event;
		});
	} else if (el.events.length > prev.events.length) {
		el.events.forEach((event: VirtualEvent, i: number) => {
			let oldEvent = prev.events[i];
			if (!oldEvent || !(event.name === oldEvent.name)) {
				prev.addEventListener(event.name, event.call);
				prev.events.push(event);
			} else {
				oldEvent = event;
			}
		});
	} else if (el.events.length < prev.events.length) {
		prev.events = prev.events.filter((event: VirtualEvent, i: number) => {
			let latest = el.events[i];
			if (!latest || !(event.name === latest.name)) {
				prev.removeEventListener(event.name, event.call);
				return false;
			} else {
				event = latest;
			}
			return event;
		});
	}
}

export default diff;
