/**
 * @AppType
 * interface for createApp class
 * @constructor el, component, config
 */
export interface AppType {
	app: Component;
	el: string;
	component: any;
	plugin: any[];
	blaze: BlazeType;
	config: any;
	mount: () => any;
	use: (plugin: any) => any;
	componentProcess: (argument: ComponentProcessArgType) => any;
	componentUpdate: (component: Component, newComponent: Component) => any;
	reloadRegistry: (component: Component, previous?: Component) => any;
	reload: (newHmr: any[], isStore: any) => any;
}
export interface ComponentProcessArgType {
	component: Component;
	newComponent: any;
	key: number;
	previous?: Component;
}

/**
 * @BlazeType
 * interface for Blaze class
 */
export interface BlazeType {
	run: {
		onMakeElement: (el: HTMLElement) => any;
		onMakeComponent: (component: Component) => any;
		onAfterAppReady: (component: Component) => any;
		onReload: (component: Component) => any;
		onStartComponent: (component: Component) => any;
		onEndComponent: (component: Component) => any;
		onDirective: (prev: Element, el: Element, opt: {
			push: () => any
		}) => any;
	};
	onMakeElement: any[];
	onMakeComponent: any[];
	onAfterAppReady: any[];
	onReload: any[];
	onStartComponent: any[];
	onEndComponent: any[];
	onDirective: any[];
}

/**
 * @InitType
 * init type of component
 */
export interface InitType{
	beforeCreate: (callback: () => any) => any;
    created: (callback: () => any) => any;
    mount: (callback: () => any) => any;
    beforeUpdate: (callback: () => any) => any;
    updated: (callback: () => any) => any;
    layout: (callback: () => any) => any;
    dispatch: (name: string, data: any, autoBatching?: boolean) => any;
    render: (callback: () => HTMLElement) => any;
    batch: (callback: () => any) => any;
    state: <T>(name: State<T>["name"], initial: T, component: State<T>["component"], call?: any) => any;
    watch: (dependencies: Watch["dependencies"], handle: Watch["handle"]) => any;
    effect: (callback: () => any) => any;
    computed: (callback: () => any) => any;
    defineProp: (props: any) => any;
}

/**
 * @VirtualEvent
 * interface for virtual event element
 */
export interface VirtualEvent {
	name: string;
	call: () => any;
	fn?: () => any;
}

/**
 * @RegisteryComponent
 * array type registery component
 */
export interface RegisteryComponent {
	key: number;
	component: Component;
}

/**
 * @Watch
 * array type watch component
 */
export interface Watch {
	dependencies: string[];
	handle: (a, b) => any;
}

/**
 * @Mount
 * array type mount component
 */
export interface Mount {
	handle: (defineConfig: any, update: boolean, enabled: boolean) => any;
	run: boolean;
}

/**
 * @State
 * argument type for state component
 */
export interface State<T>{
	name: string | any;
	initial: T;
	component: Component | null;
	registryCall?: () => Component[];
	listeningCall?: () => any[];
}

/**
 * @Component
 * interface of component
 */
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
		registry: {
			value: any;
			add: (key, value) => any;
			delete: (key) => any;
			each: (callback) => any;
			map: (callback) => any;
		};
		watch: Watch[];
		trigger();
		remove(notClear?: boolean, notNode?: boolean);
		dispatch?: any;
		time?: string;
		disableAddUnmount?: boolean;
		active?: boolean;
		queue?: any[];
		// lifecycle
		beforeCreate?: Function[];
		created?: Function[];
		mount: Mount[];
		mounted(update?: boolean, hmr?: boolean);
		unmount: Function[];
		layout?: Function[];
		beforeUpdate?: Function[];
		updated?: Function[];
		effect?: Function[];
	};
	$config?: {
		dev: boolean;
		key?: number;
	};
}

/**
 * @ConfigEntityRender
 * config type on entityrender
 */
export type ConfigEntityRender = {
	inject?: any;
	arg?: any[];
	key: number;
};

/**
 * @EntityCompile
 * argument type for entitycompile
 */
export type EntityCompile = {
	first: boolean;
	key?: number;
	data?: any;
	children?: HTMLElement[];
	deep?: Component["$deep"];
};

/**
 * @EntityRenderType
 * type for entityrender
 * @constructor component, config
 */
export type EntityRenderType = {
	config: ConfigEntityRender;
	component: Component | any;
	before(callback: (current: any) => any );
	beforeCompile(callback: (current: any) => any );
	start();
	done(callback: (current: any) => any );
	compile(option: EntityCompile);
	saveToExtension();
	mount(update?: boolean);
	remove(notNode?: boolean);
	replaceChildren(entry: string);
	appendChild(target: HTMLElement);
}