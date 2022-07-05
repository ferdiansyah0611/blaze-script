import { log } from "./utils";

export const getPreviousUtilites = (first, $deep, el) => {
	if ($deep.update) {
		if (first) {
			return $deep.node[$deep.node.length - 1]?.el;
		}
		return $deep.node[$deep.$id - 1]?.el;
	} else {
		return el;
	}
};

export const childrenUtilites = (children, el, $deep) => {
	if (children.length === 1 && typeof children[0] === "string") {
		el.append(document.createTextNode(children[0]));
	} else if (children.length) {
		children.forEach((item) => {
			// node
			if (item && item.nodeName) {
				if (!$deep.update) {
					log("[appendChild]", item.tagName);
					el.appendChild(item);
				}
			}
			// string/number
			if (["string", "number"].includes(typeof item)) {
				el.append(document.createTextNode(item.toString()));
			}
		});
	}
};

export const attributeUtilites = (first, data, el, $deep, component) => {
	Object.keys(data).forEach((item) => {
		// event
		if (item.match(/^on[A-Z]/)) {
			el.addEventListener(item.toLowerCase().slice(2), data[item]);
			delete data[item.match(/^on[A-Z][a-z]+/)[0]];
		}
		// logic
		if (item === "if") {
			log("[if]", data[item]);

			let current = getPreviousUtilites(first, $deep, el);
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
			let current = getPreviousUtilites(first, $deep, el);
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
			let current = getPreviousUtilites(first, $deep, el);
			if (typeof data.i === "number") {
				component[data[item]][data.i] = current;
			} else {
				component[data[item]] = current;
			}
		}
		el[item] = data[item];
	});
};
