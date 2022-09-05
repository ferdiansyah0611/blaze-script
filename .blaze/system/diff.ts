import {
	unmountAndRemoveRegistry,
	mountComponentFromEl,
	findComponentNode,
	mountSomeComponentFromEl,
	removeRegistry,
} from "./dom";
import { Component, VirtualEvent, RegisteryComponent } from "../blaze.d";
import Lifecycle from "./lifecycle";

/**
 * @diff
 * diff attribute, skip, textNode, input element
 * update refs
 */
const diff = function (prev: Element, el: Element, component: Component, hmr: Component) {
	let zip = [];
	// null
	if (!prev || !el) {
		return zip;
	}
	// different nodename
	if (prev.nodeName !== el.nodeName) {
		zip.push(() => prev.replaceWith(el));
		return zip;
	}
	// different key
	if (prev["dataset"]["i"] && el["dataset"]["i"] && prev["dataset"]["i"] !== el["dataset"]["i"]) {
		// if component
		if (prev["dataset"]["n"] && el["dataset"]["n"] && prev["$root"] && el["$root"]) {
			removeRegistry(prev.$root, prev.$children);
			if (prev.$name !== el.$name) {
				prev.replaceWith(el);
			} else {
				prev["dataset"].i = el.key;
				prev.key = el.key;

				let difference = diff(prev, el, prev.$children || component, hmr);
				difference.forEach((rechange: Function) => rechange());
				nextDiffChildren(Array.from(prev.children), el, prev.$children || component);
			}
			mountComponentFromEl(el);
		} else {
			prev["dataset"].i = el.key;
			prev.key = el.key;

			let difference = diff(prev, el, prev.$children || component, hmr);
			difference.forEach((rechange: Function) => rechange());
			nextDiffChildren(Array.from(prev.children), el, prev.$children || component);
		}
		// return zip;
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
			prev.$children.$node = prev
			// console.log('prev', prev);
			mountComponentFromEl(prev);
		});
	}
	// text/button/link/code
	if (
		["SPAN", "P", "H1", "H2", "H3", "H4", "H5", "H6", "A", "BUTTON", "CODE"].includes(prev.nodeName) ||
		prev["content"] ||
		el["content"]
	) {
		if (prev["content"] || el["content"]) {
			prev["content"] = el["content"];
		}

		const rechange = (node, i) => {
			if (node && el.childNodes[i] !== undefined && node.data !== el.childNodes[i].data) {
				zip.push(() => {
					node.replaceData(0, -1, el.childNodes[i].data);
				});
			}
		};
		if (!prev.childNodes.length && el.childNodes.length) {
			zip.push(() => {
				el.childNodes.forEach((node: Element) => {
					prev.appendChild(node);
				});
			});
		} else if (prev.childNodes.length && !el.childNodes.length) {
			zip.push(() => {
				prev.childNodes.forEach((node: Element) => {
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
						el.childNodes.forEach((nodes: Element, key: number) => {
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
	if (prev["value"] !== el["value"]) {
		zip.push(() => (prev["value"] = el["value"]));
	}
	// event
	if ((prev.events || el.events) && !prev["on:toggle"] && !el["on:toggle"] && !prev.model && !el.model) {
		zip.push(() => {
			eventDiff(prev, el, hmr);
		});
	}
	// on:toggle
	if (prev["on:toggle"] || el["on:toggle"]) {
		if (prev["on:toggle"] && !el["on:toggle"]) {
			zip.push(() => {
				prev.events = prev.events.filter((event) => {
					if (event.name === "click") {
						prev.removeEventListener(event.name, event.call);
						prev["on:toggle"] = "";
						return false;
					}
					return event;
				});
				eventDiff(prev, el, hmr);
			});
		} else if (!prev["on:toggle"] && el["on:toggle"]) {
			zip.push(() => {
				el.events.forEach((event) => {
					if (event.name === "click") {
						prev.addEventListener(event.name, event.call);
						prev["on:toggle"] = el["on:toggle"];

						if (!prev.events) prev.events = [];
						prev.events.push(event);
					}
				});
				eventDiff(prev, el, hmr);
			});
		} else if (prev["on:toggle"] !== el["on:toggle"]) {
			zip.push(() => {
				prev["on:toggle"] = el["on:toggle"];
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
	// on:show
	if (prev["on:show"] || el["on:show"]) {
		if (prev["on:show"] && !el["on:show"]) {
			zip.push(() => (prev["style"].display = "none"));
		}
		prev["on:show"] = el["on:show"];
	}
	// batch
	if (prev.batch || el.batch) {
		if (!prev.batch && el.batch) {
			prev.batch = el.batch;
		}
		if (prev.batch && !el.batch) {
			delete prev.batch;
		}
	}
	// trigger
	if (prev.trigger || el.trigger) {
		if (!prev.trigger && el.trigger) {
			prev.trigger = el.trigger;
		}
		if (prev.trigger && !el.trigger) {
			delete prev.trigger;
		}
	}
	// for
	if (prev["for"] || el["for"]) {
		if (!prev["for"] && el["for"]) {
			prev["for"] = el["for"];
		}
		if (prev["for"] && !el["for"]) {
			delete prev["for"];
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
	oldest: Element,
	newest: Element,
	component: Component,
	first: boolean = true,
	hmr?: Component
) => {
	if (!newest || !oldest || oldest["skip"]) {
		return;
	}
	if (typeof oldest["show"] === "boolean") {
		if (!newest["show"]) {
			oldest.remove();
			return;
		}
	}

	if ((oldest.$name || newest.$name) !== component.constructor.name) {
		return;
	}
	if (oldest.children.length !== newest.children.length) {
		let oldestChildren: Element[] = Array.from(oldest.children),
			newestChildren: Element[] = Array.from(newest.children);

		if (!oldest.children.length && newest.children.length) {
			oldest.replaceChildren(...newestChildren);
			Array.from(oldest.children).forEach((node: Element) => {
				mountComponentFromEl(node, component.constructor.name, true);
			});
			return;
		} else if (oldest.children.length && !newest.children.length) {
			oldestChildren.forEach((node: Element) => {
				unmountAndRemoveRegistry(newest, node, true);
				node.remove();
			});
			oldest.replaceChildren(...newestChildren);
			return;
		} else if (newest.children.length < oldest.children.length) {
			oldestChildren.forEach((node: Element, i: number) => {
				let check = newestChildren[i];
				let isComponent = false;
				let withoutKey = false;
				let recursive = (real, fake) => {
					if (real.$children || real["dataset"]["i"]) {
						let find = real.$children ? findComponentNode(newest, real) : newest.querySelector(`[data-i="${real["dataset"]["i"]}"]`);
						isComponent = true;
						withoutKey = false;
						if (!find && !real["dataset"]["keep"]) {
							real.$children && removeRegistry(real.$root, real.$children);
							if(oldest["for"]) {
								node.remove();
							} else {
								real.remove();
							}
						}
						return;
					} else {
						withoutKey = true;
					}

					if(real.$name === component.constructor.name) {
						Array.from(real.children).forEach((reals, i) => {
							recursive(reals, fake?.children[i]);
						});
					}
				};
				recursive(node, check);
				if (!isComponent && !check && node) {
					node.remove();
					return;
				}
				if (!isComponent && withoutKey && node) {
					nextDiffChildren(Array.from(node.children), check, component, hmr);
				}
			});
			return;
		} else if (newest.children.length > oldest.children.length) {
			Array.from(newest.children).forEach((node: Element, i: number) => {
				let isComponent = false;
				mountSomeComponentFromEl(oldest, node, oldest.children[i], component.constructor.name, () => {
					oldest.children[i].insertAdjacentElement("beforebegin", node);
				}, () => {
					isComponent = true;
				});
				if(!isComponent && oldest.children[i]) {
					nextDiffChildren(Array.from(oldest.children[i].children), node, component, hmr);
					return;
				}
				if (!oldest.children[i]) {
					oldest.children[i - 1].insertAdjacentElement("afterend", node);
				}
			});
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
function nextDiffChildren(children: Element[], newest: any, component: Component, hmr?: Component) {
	children.forEach((item: Element, i: number) => {
		let difference = diff(item, newest.children[i], component, hmr);
		difference.forEach((rechange: Function) => rechange());
		diffChildren(item, newest.children[i], component, false);
	});
}

/**
 * @eventDiff
 * diff a event listener
 */
function eventDiff(prev: Element, el: Element, hmr: Component) {
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
