export interface InterfaceApp {
	mount: () => any;
	use: (plugin: any) => any;
}
export interface InterfaceBlaze {
	runEveryMakeElement: (el: HTMLElement) => void;
	runEveryMakeComponent: (component: Component) => void;
}

export interface RegisteryComponent {
	key: number;
	component: Component;
}
export interface Watch {
	dependencies: string[];
	handle: (a, b) => any;
}
export interface Mount {
	handle: (defineConfig: any, update: boolean) => any;
	run: boolean;
}

export interface Component {
	$h: any;
	$node: HTMLElement;
	$router: any;
	$portal?: string;
	ctx: Object;
	props: Object | any;
	render();
	children: HTMLElement | boolean | any;
	disableExtension?: boolean;
	$deep: {
		batch: boolean;
		disableTrigger: boolean;
		disableExtension?: boolean;
		hasMount: boolean;
		update: number;
		registry: RegisteryComponent[];
		watch: Watch[];
		trigger();
		remove();
		dispatch?: any;
		time?: string;
		disableAddUnmount?: boolean;
		active?: boolean;
		// lifecycle
		beforeCreate?: Function[];
		created?: Function[];
		mount: Mount[];
		mounted(update?: boolean);
		unmount: Function[];
		layout?: Function[];
		beforeUpdate?: Function[];
		updated?: Function[];
	};
	$config?: {
		dev: boolean;
		key?: number;
	};
}
