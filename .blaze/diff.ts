import { log } from "./utils";

const diff = function (prev: HTMLElement, el: HTMLElement) {
	let batch = [];
	if (!prev) {
		return batch;
	}
	if (el === undefined) {
		batch.push(() => prev.remove());
	}
	// node
	if (prev.nodeName !== el.nodeName) {
		batch.push(() => prev.replaceWith(el));
	}
	// text
	if (prev.childNodes.length) {
		prev.childNodes.forEach((node: any, i: number) => {
			if (node && el.childNodes[i] !== undefined) {
				if (node.data && node.data !== el.childNodes[i].data) {
					batch.push(() => {
						log("[text]", node.data, ">", el.childNodes[i].data);
						node.replaceData(0, -1, el.childNodes[i].data);
					});
				}
			}
		});
	}
	// class
	if (prev.className !== el.className) {
		batch.push(() => (prev.className = el.className));
	}
	// attribute
	if (prev.attributes.length) {
		if (typeof prev.if === "boolean") {
			if (prev.if) {
				batch.push(() => prev.removeAttribute("style"));
			}
		}
		batch.push(() => {
			for (var i = 0; i < prev.attributes.length; i++) {
				if (
					prev.attributes[i] &&
					el.attributes[i] &&
					prev.attributes[i].name === el.attributes[i].name
				) {
					if (prev.attributes[i].value !== el.attributes[i].value) {
						log(
							"[different]",
							prev.attributes[i].value,
							el.attributes[i].value
						);
						prev.attributes[i].value = el.attributes[i].value;
					}
				}
			}
		});
	}
	// input
	if (prev.value !== el.value) {
		batch.push(() => (prev.value = el.value));
	}

	return batch;
};

export default diff;
