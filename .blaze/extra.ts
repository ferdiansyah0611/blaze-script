import { batch } from "@blaze";

export const useTransition = (name: string, component) => {
	return async function (callback: () => any) {
		component[name] = true;
		component.$deep.trigger();
		await batch(callback, component);
		component[name] = false;
		component.$deep.trigger();
	};
};
