import Dom from "./dom";
import { Component, VirtualEvent } from "../blaze.d";
import Lifecycle from "./lifecycle";
import { isTextNode } from "./constant";
import { getBlaze } from "./core";

/**
 * @diff
 * diff attribute, skip, textNode, input element, update refs
 */
const diff = function (prev: Element, el: Element, component: Component, hmr: Component) {
	let zip = [];
	let isText = isTextNode(prev, el);
	// null/svg/fragment
	if (!prev || !el || el instanceof SVGElement || prev.nodeName === "#document-fragment") {
		return zip;
	}
	// manual skip diff
	if (prev.diff || el.diff) {
		prev.diff = el.diff;
		if (prev.diff) {
			return zip;
		}
	}
	// different nodename
	if (prev.nodeName !== el.nodeName) {
		zip.push(() => prev.replaceWith(el));
		return zip;
	}
	// different key
	if (!isText && prev["dataset"]["i"] && el["dataset"]["i"] && prev["dataset"]["i"] !== el["dataset"]["i"]) {
		// if component
		if (prev["dataset"]["n"] && el["dataset"]["n"] && prev["$root"]) {
			Dom.destroyRegistry({ parent: prev.$children.$root, active: prev.$children, isDisableRemove: true });
			prev.replaceWith(el.$children.$node);
			if (!el.$children.$deep.hasMount) {
				Dom.mountComponent({ el })
			}
		} else {
			prev["dataset"].i = el.key;
			prev.key = el.key;

			nextDiffChildren(Array.from(prev.childNodes), el, prev.$children || component);
		}
	}
	// different component in same node
	if (prev.$name && el.$name && prev.$name !== el.$name) {
		let name = prev.$name;
		let key = prev.key;

		if (prev.$children.$root) {
			let find = prev.$children.$root.$deep.registry.value[name + key];
			if (find) {
				new Lifecycle(find).unmount();
				find.$deep.mount = find.$deep.mount.map((item) => {
					item.run = false;
					return item;
				});
				find.$deep.hasMount = false;
				find.$deep.disableAddUnmount = true;
			}
		}
		zip.push(() => {
			prev.$name = el.$name;
			prev.$children = el.$children;
			prev.key = el.key || 0;
			prev["replaceChildren"](...Array.from(el.childNodes));
			prev.$children.$node = prev;
			Dom.mountComponent({ el: prev });
		});
	}
	// text node
	if (isText) {
		if (prev["data"] !== el["data"]) {
			zip.push(() => {
				prev["replaceData"](0, -1, el["data"]);
			});
		}
	}
	// refs
	if (prev.refs || el.refs) {
		let lifecycle = new Lifecycle(component);
		if (!prev.refs && el.refs) {
			zip.push(() => {
				Dom.makeRefs({ component, name: el.refs, el: prev });
				lifecycle.effect(el.refs);
			});
		} else if (prev.refs && !el.refs) {
			zip.push(() => {
				prev.removeAttribute("refs");
				lifecycle.effect(prev.refs);
			});
		} else if (prev.refs !== el.refs) {
			zip.push(() => {
				prev.removeAttribute("refs");
				Dom.makeRefs({ component, name: el.refs, el: prev });
				lifecycle.effect(el.refs);
			});
		}
	}
	// attribute
	if (!isText && (prev.attributes.length || el.attributes.length)) {
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
			oldAttr.forEach((name, i) => {
				let oldValue = prev.getAttribute(name);
				let newValue = el.getAttribute(name);
				if (name !== newAttr[i]) {
					zip.push(() => {
						prev.removeAttribute(name);
						prev.setAttribute(newAttr[i], el.getAttribute(newAttr[i]));
					});
				} else if (oldValue !== newValue) {
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

	/**
	 * @onDirective
	 * run directive customization
	 */
	let blaze = getBlaze(component.$config?.key || 0);
	if (blaze && blaze.run) {
		blaze.run.onDirective(prev, el, {
			push: (value) => zip.push(value),
		});
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
	if (oldest.childNodes.length !== newest.childNodes.length) {
		let oldestChildren: ChildNode[] = Array.from(oldest.childNodes),
			newestChildren: ChildNode[] = Array.from(newest.childNodes);

		if (!oldest.childNodes.length && newest.childNodes.length) {
			let replaceNonText = oldest["replaceChildren"];
			if (replaceNonText) {
				oldest["replaceChildren"](...newestChildren);
			} else {
				oldest["replaceWith"](newest)
			}
			Array.from(oldest.childNodes).forEach((node: Element) => {
				Dom.mountComponent({ el: node, name: component.constructor.name, isKey: true});
			});
			return;
		} else if (oldest.childNodes.length && !newest.childNodes.length) {
			oldestChildren.forEach((node: Element) => {
				Dom.destroyComponent({
					parentFake: newest, active: node, isCheckSub: true
				})
				node.remove();
			});
			oldest["replaceChildren"](...newestChildren);
			return;
		} else if (newest.childNodes.length < oldest.childNodes.length) {
			let action = [];
			oldestChildren.forEach((node: Element, i: number) => {
				let check = newestChildren[i];
				let isComponent = false;
				let withoutKey = false;
				let unmounted = (real: Element) => {
					real.$children && Dom.destroyRegistry({ parent: real.$children.$root, active: real.$children, isDisableRemove: true });
				};
				let recursive = (real: Element, fake: ChildNode) => {
					if (isTextNode(real, fake)) {
						Dom.destroyComponent({
							parentFake: newest, active: real, isCheckSub: true
						})
						diffText(real, fake, node.previousSibling)
						// if node string === undefined
						if (real && real["data"] && real["data"] === 'undefined') {
							if (fake) {
								real.replaceWith(fake)
							}
							else{
								real.remove()
							}
						}
						return;
					};
					// different nodename
					if ((real && fake) && real.nodeName !== fake.nodeName) {
						// if component
						if (real["dataset"]["n"] && fake["dataset"]["n"]) {
							// different component
							if (real["dataset"]["n"] !== fake["dataset"]["n"]) {
								const realCheckOnFake = Dom.find({ parent: newest, item: real })
								if (!realCheckOnFake) {
									Dom.destroyComponent({
										parentFake: newest, active: real, isCheckSub: true, isDisableRemove: true
									})
									Dom.mountComponentElement({
										parentReal: oldest, el: fake as Element, current: real, name: component.constructor.name
									})
								}
							}
						}
						real.replaceWith(fake)

						if (fake["$children"]) {
							fake["$children"].$node = fake
						}
						return;
					}
					if (real["$children"] || real["dataset"]["i"]) {
						let defineNode = oldest["for"] ? node : real;
						let find = real["$children"]
							? Dom.find({ parent: newest, item: real })
							: newest.querySelector(`[data-i="${real["dataset"]["i"]}"]`);
						isComponent = true;
						withoutKey = false;

						if (!real["dataset"]["keep"]) {
							if (
								(!find && (fake && real["dataset"]["i"] !== fake["dataset"]["i"]) === false) ||
								(!fake && !find)
							) {
								action.push(() => defineNode.remove());
								unmounted(real);
							} else if (fake && real["dataset"]["i"] !== fake["dataset"]["i"]) {
								if (!find) {
									unmounted(real);
									if (
										(real["$children"] && fake["$children"]) ||
										(!real["$children"] && fake["$children"])
									) {
										let replace = fake;
										if (fake["$children"] && fake["$children"].$node)
											replace = fake["$children"].$node;
										action.push(() => real.replaceWith(replace));
										if (fake["$children"] && !fake["$children"].$deep.hasMount) {
											Dom.mountComponent({ el: fake })
										}
									} else {
										action.push(() => defineNode.remove());
									}
								}
							} else if (!real["$children"] && fake) {
								nextDiffChildren(Array.from(node.childNodes), real, component, hmr);
							} else if (!real["$children"]) {
								if (!find) {
									action.push(() => defineNode.remove());
								}
							}
						}
						return;
					} else {
						withoutKey = true;
					}

					if (real.$name === component.constructor.name) {
						Array.from(real.childNodes).forEach((reals: Element, i) => {
							let fakes;
							if (fake && fake.childNodes[i]) fakes = fake.childNodes[i];
							recursive(reals, fakes);
						});
					}
				};
				recursive(node, check);

				if (!isComponent && !check && node) {
					node.remove();
					return;
				}
				if (!isComponent && withoutKey && node) {
					nextDiffChildren(Array.from(node.childNodes), check, component, hmr);
				}
			});
			action.forEach((fn) => fn());
			return;
		} else if (newest.childNodes.length > oldest.childNodes.length) {
			newestChildren.forEach((node: Element, i: number) => {
				let current = oldest.childNodes[i];
				let isComponent = false;
				if (isTextNode(current, node)) {
					diffText(current, node, oldest.childNodes[i - 1]);
					if (current && current["data"] && current["data"] === 'undefined') {
						Dom.mountComponentElement({
							parentReal: oldest, el: node, current, name: component.constructor.name
						})
						current.replaceWith(node);
					}
					return;
				}
				// different nodename
				if ((current && node) && current.nodeName !== node.nodeName) {
					// component
					if (current["dataset"]["n"] || node["dataset"]["n"]) {
						let findNewNode = Dom.find({ parent: newest, item: current as Element });
						if (!findNewNode) {
							Dom.destroyComponent({
								parentFake: newest, active: current as Element, isCheckSub: true, isDisableRemove: true
							})
						}
					}
					Dom.mountComponentElement({
						parentReal: oldest, el: node, current, name: component.constructor.name
					})
					current.replaceWith(node)
					return;
				}
				// mount if component
				Dom.mountComponentElement({
					parentReal: oldest,
					el: node,
					current,
					name: component.constructor.name,
					callback(){
						oldest.childNodes[i]["insertAdjacentElement"]("beforebegin", node);
					},
					callbackComponent(){
						isComponent = true;
					}
				})
				// diffing a element and not component
				if (!isComponent && oldest.childNodes[i]) {
					nextDiffChildren(Array.from(oldest.childNodes[i].childNodes), node, component, hmr);
					return;
				}
				// insert element
				if (!oldest.childNodes[i]) {
					let insertNonText = oldest.childNodes[i - 1]["insertAdjacentElement"];
					if (insertNonText) {
						oldest.childNodes[i - 1]["insertAdjacentElement"]("afterend", node);
					}
					else {
						oldest.childNodes[i - 1]["after"](node);
					}
				}
			});
			return;
		}
	} else {
		if (first) {
			let difference = diff(oldest, newest, component, hmr);
			difference.forEach((rechange: Function) => rechange());
		}
		nextDiffChildren(Array.from(oldest.childNodes), newest, component, hmr);
	}
};

/**
 * @nextDiffChildren
 * action to next diff a children
 */
function nextDiffChildren(childNodes: ChildNode[], newest: any, component: Component, hmr?: Component) {
	childNodes.forEach((item: Element, i: number) => {
		let difference = diff(item, newest.childNodes[i], component, hmr);
		difference.forEach((rechange: Function) => rechange());
		diffChildren(item, newest.childNodes[i], component, false);
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

/**
 * @diffText
 * diff a text node
 */
function diffText(oldNode, newNode, prev) {
	if (!oldNode && !newNode) return;
	if (!oldNode && newNode) return prev.after(newNode);
	if (oldNode && !newNode) return oldNode.remove();
	if (oldNode.data === newNode.data) return;
	if (oldNode.data !== newNode.data) {
		if (oldNode.nodeType === Node.ELEMENT_NODE) return oldNode.replaceWith(newNode);
		return oldNode.replaceData(0, -1, newNode.data);
	}
}

export default diff;
