import { rendering } from "@root/core";
import Extension from './component/Extension';

type Log = {
	msg: string;
	at?: Date;
	type?: "success" | "warn" | "error";
};

export const addLog = (data: Log, trigger: boolean = true) => {
	if (window.$extension) {
		window.$extension.addLog(
			{
				msg: typeof data.msg === 'string' ? data.msg : JSON.stringify(data.msg),
				type: data.type,
				at: new Date(),
			},
			trigger
		);
	}
};
export const addComponent = (data, trigger = true) => {
	if (window.$extension) {
		window.$extension.addComponent(data, trigger);
	}
};

export const withExtension = (entry: string, enabled: boolean) => {
	return (app, blaze, hmr, keyApp) => {
		app;blaze;hmr;
		let query = document.querySelector(entry);
		if (query && enabled && !window.$extension) {
			let component = new Extension(keyApp);
			rendering(component, null, true, false, {}, 0, component.constructor.name, []);
			query.replaceChildren(component.$node);
			component.$deep.mounted(false);
		}
	};
};

export const reload = () => {
	if (window.$extension) {
		window.$extension.reload()
	}
}