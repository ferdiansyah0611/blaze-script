export const isTextNode = function (oldNode, newNode): boolean {
	if (!oldNode && !newNode) return false;
	return ((oldNode && oldNode.nodeType === Node.TEXT_NODE) || (newNode && newNode.nodeType === Node.TEXT_NODE));
};
export const isComponent = (component): boolean => component.toString().indexOf("init(this)") !== -1;
export const isSameName = (component, newComponent): boolean => newComponent && component && newComponent.name === component.constructor.name;