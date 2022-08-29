import { removeComponentOrEl, unmountAndRemoveRegistry, mountComponentFromEl, findComponentNode } from "./dom";
import { Component, VirtualEvent, RegisteryComponent } from "../blaze.d";
import Lifecycle from "./lifecycle";

/**
 * @diff
 * diff attribute, skip, textNode, input element
 * update refs
 */
const diff = function (prev: HTMLElement, el: HTMLElement, component: Component, hmr: Component) {
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
			prev.$root.$deep.registry.forEach((registry: RegisteryComponent) => {
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
				return registry;
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
			zip.push(() => {
				el.childNodes.forEach((node: HTMLElement) => {
					prev.appendChild(node);
				});
			});
		} else if (prev.childNodes.length && !el.childNodes.length) {
			zip.push(() => {
				prev.childNodes.forEach((node: HTMLElement) => {
					node.remove();
				});
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
		// zip.push(() => {
		let oldAttr = prev.getAttributeNames();
		let newAttr = el.getAttributeNames();
		// !old new
		if (!oldAttr.length && newAttr.length) {
			newAttr.forEach((name) => {
				zip.push(() => {
					prev.setAttribute(name, el.getAttribute(name));
				});
			});
		}
		// old !new
		else if (oldAttr.length && !newAttr.length) {
			oldAttr.forEach((name) => {
				zip.push(() => {
					prev.removeAttribute(name);
				});
			});
		}
		// same
		else if (oldAttr.length === newAttr.length) {
			oldAttr.forEach((name) => {
				let oldValue = prev.getAttribute(name);
				let newValue = el.getAttribute(name);
				if (oldValue !== newValue) {
					zip.push(() => {
						prev.setAttribute(name, newValue);
					});
				}
			});
		}
		// add
		else if (newAttr.length > oldAttr.length) {
			newAttr.forEach((name) => {
				let check = prev.getAttribute(name);
				if (!check) {
					zip.push(() => {
						prev.setAttribute(name, el.getAttribute(name));
					});
				}
			});
		}
		// delete
		else if (newAttr.length < oldAttr.length) {
			oldAttr.forEach((name) => {
				let check = el.getAttribute(name);
				if (!check) {
					zip.push(() => {
						prev.removeAttribute(name);
					});
				}
			});
		}
		// });
	}
	// refs
	if (prev.refs || el.refs) {
		let lifecycle = new Lifecycle(component);
		let updateRefs = (name, value) => {
			if (typeof prev.i === "number") {
				if (!component[name]) {
					component[name] = [];
				}
				component[name][prev.i] = prev;
			} else {
				if ((name && component[name] && !component[name].isSameNode(value)) || !component[name]) {
					component[name] = value;
				}
			}
		};
		if (!prev.refs && el.refs) {
			zip.push(() => {
				updateRefs(el.refs, prev);
				prev.refs = el.refs;

				lifecycle.effect(el.refs);
			});
		} else if (prev.refs && !el.refs) {
			zip.push(() => {
				let refs = prev.refs;
				delete component[prev.refs];
				delete prev.refs;

				lifecycle.effect(refs);
			});
		} else if (prev.refs !== el.refs) {
			zip.push(() => {
				delete component[prev.refs];
				delete prev.refs;

				updateRefs(el.refs, prev);
				prev.refs = el.refs;

				lifecycle.effect(el.refs);
			});
		}
	}
	// input
	if (prev.value !== el.value) {
		zip.push(() => (prev.value = el.value));
	}
	// event
	if ((prev.events || el.events) && !prev['on:toggle'] && !el['on:toggle'] && !prev.model && !el.model) {
		zip.push(() => {
			eventDiff(prev, el, hmr);
		});
	}
	// on:toggle
	if (prev['on:toggle'] || el['on:toggle']) {
		if (prev['on:toggle'] && !el['on:toggle']) {
			zip.push(() => {
				prev.events = prev.events.filter((event) => {
					if (event.name === "click") {
						prev.removeEventListener(event.name, event.call);
						prev['on:toggle'] = "";
						return false;
					}
					return event;
				});
				eventDiff(prev, el, hmr);
			});
		} else if (!prev['on:toggle'] && el['on:toggle']) {
			zip.push(() => {
				el.events.forEach((event) => {
					if (event.name === "click") {
						prev.addEventListener(event.name, event.call);
						prev['on:toggle'] = el['on:toggle'];

						if (!prev.events) prev.events = [];
						prev.events.push(event);
					}
				});
				eventDiff(prev, el, hmr);
			});
		} else if (prev['on:toggle'] !== el['on:toggle']) {
			zip.push(() => {
				prev['on:toggle'] = el['on:toggle'];
				eventDiff(prev, el, hmr);
			});
		}
	}
	// model
	if (prev.model || el.model) {
		if (prev.model && !el.model) {
			prev.events = prev.events.filter((event) => {
				if (event.call.toString().indexOf("model") !== -1 && ["keyup", "change"].includes(event.name)) {
					zip.push(() => {
						prev.removeEventListener(event.name, event.call);
						prev.model = "";
					});
					return false;
				}
				return event;
			});
		} else if (!prev.model && el.model) {
			el.events.forEach((event) => {
				if (event.call.toString().indexOf("model") !== -1 && ["keyup", "change"].includes(event.name)) {
					zip.push(() => {
						prev.addEventListener(event.name, event.call);
						prev.model = el.model;

						if (!prev.events) prev.events = [];
						prev.events.push(event);
					});
				}
			});
		} else if (prev.model !== el.model) {
			zip.push(() => {
				prev.model = el.model;
			});
		}
	}
	// on:active
	if (prev["on:active"] || el["on:active"]) {
		if (!prev["on:active"] && el["on:active"]) {
			zip.push(() => {
				prev["on:active"] = el["on:active"];
				prev.classList.add("active");
			});
		}
		if (prev["on:active"] && !el["on:active"]) {
			zip.push(() => {
				delete prev["on:active"];
				prev.classList.remove("active");
			});
		}
	}
	// batch
	if(prev.batch || el.batch) {
		if(!prev.batch && el.batch) {
			prev.batch = el.batch
		}
		if(prev.batch && !el.batch) {
			delete prev.batch
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
export const diffChildren = (
	oldest: any,
	newest: any,
	component: Component,
	first: boolean = true,
	hmr?: Component
) => {
	if (!newest || !oldest || oldest.skip) {
		return;
	}
	if (oldest.for) {
		let oldestChildren: HTMLElement[] = Array.from(oldest.children),
			newestChildren: HTMLElement[] = Array.from(newest.children);

		if (!oldest.children.length && !newest.children.length) {
			return;
		}
		// replacing if oldest.children === 0
		else if (!oldest.children.length && newest.children.length) {
			oldest.replaceChildren(...newest.children);
			oldestChildren.forEach((node: HTMLElement) => {
				// mount
				mountComponentFromEl(node);
			});
			return;
		} else if (oldest.children.length && !newest.children.length) {
			oldestChildren.forEach((node: HTMLElement) => {
				unmountAndRemoveRegistry({ oldest, newest }, node);
				node.remove();
			});
			return;
		}
		// not exists, auto delete...
		else if (newest.children.length < oldest.children.length) {
			oldestChildren.forEach((node: HTMLElement) => {
				let latest = findComponentNode(newest, node);
				if (!latest) {
					removeComponentOrEl(node, component);
					return;
				}
			});
			nextDiffChildren(Array.from(oldest.children), newest, component);
			return;
		}
		// new children detection
		else if (newest.children.length > oldest.children.length) {
			let checked = false;
			newestChildren.forEach((node: HTMLElement, i: number) => {
				let latest = findComponentNode(oldest, node);
				if (!latest) {
					let check = oldest.children[i];
					if (check) {
						check.insertAdjacentElement("beforebegin", node);
					} else {
						let oldChild: HTMLElement[] = Array.from(oldest.children);
						oldChild[i - 1].insertAdjacentElement("afterend", node);
					}

					// mount
					mountComponentFromEl(node);
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
						unmountAndRemoveRegistry({ oldest, newest }, node);
						if (node.$name !== newestChildren[i].$name) {
							node.replaceWith(newestChildren[i]);
						} else {
							node.dataset.i = newestChildren[i].key;
							node.key = newestChildren[i].key;
							node.replaceWith(newestChildren[i]);
						}
						// mount
						mountComponentFromEl(newestChildren[i]);
					} else {
						if (node.updating) {
							node.updating = false;
							let difference = diff(node, newestChildren[i], node.$children, hmr);
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
				mountComponentFromEl(node, component.constructor.name, true);
			});
			return;
		} else if (oldest.children.length && !newest.children.length) {
			oldestChildren.forEach((node: HTMLElement) => {
				// unmount
				unmountAndRemoveRegistry({ oldest, newest }, node, true);
			});
			oldest.replaceChildren(...newest.children);
			return;
		} else if (newest.children.length < oldest.children.length) {
			oldestChildren.forEach((node: HTMLElement) => {
				unmountAndRemoveRegistry({ oldest, newest }, node, true, () => {
					insert = true;
					node.remove();
				});
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
						mountComponentFromEl(node, component.constructor.name, true);
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
			let difference = diff(oldest, newest, component, hmr);
			difference.forEach((rechange: Function) => rechange());
		}
		nextDiffChildren(Array.from(oldest.children), newest, component, hmr);
	}
};

/**
 * @nextDiffChildren
 * action to next diff a children
 */
function nextDiffChildren(children: HTMLElement[], newest: any, component: Component, hmr?: Component) {
	children.forEach((item: HTMLElement, i: number) => {
		let difference = diff(item, newest.children[i], component, hmr);
		difference.forEach((rechange: Function) => rechange());
		diffChildren(item, newest.children[i], component, false);
	});
}

/**
 * @eventDiff
 * diff a event listener
 */
function eventDiff(prev: HTMLElement, el: HTMLElement, hmr: Component) {
	if (prev.events && prev.events.length && (!el.events || !el.events.length)) {
		prev.events.forEach((event: VirtualEvent) => {
			prev.removeEventListener(event.name, event.call);
		});
		prev.events = [];
	} else if ((!prev.events || !prev.events.length) && el.events && el.events.length) {
		el.events.forEach((event: VirtualEvent) => {
			if (hmr) {
				event.fn = event.fn.bind(hmr);
			}
			prev.addEventListener(event.name, event.call);
		});
		prev.events = el.events;
	} else if (prev.events && el.events && prev.events.length === el.events.length) {
		prev.events = prev.events.map((event: VirtualEvent, i: number) => {
			let latest = el.events[i];
			if (event.name === latest.name) {
				event = latest;
			}
			if (hmr && event.fn) {
				event.fn = event.fn.bind(hmr);
			}
			return event;
		});
	} else if (el.events && prev.events) {
		if (el.events.length > prev.events.length) {
			el.events.forEach((event: VirtualEvent, i: number) => {
				let oldEvent = prev.events[i];
				if (!oldEvent || !(event.name === oldEvent.name)) {
					if (hmr && event.fn) {
						event.fn = event.fn.bind(hmr);
					}
					prev.addEventListener(event.name, event.call);
					prev.events.push(event);
				} else {
					oldEvent = event;
					if (hmr && oldEvent.fn) {
						oldEvent.fn = oldEvent.fn.bind(hmr);
					}
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
					if (hmr && event.fn) {
						event.fn = event.fn.bind(hmr);
					}
				}
				return event;
			});
		}
	}
}

export default diff;
