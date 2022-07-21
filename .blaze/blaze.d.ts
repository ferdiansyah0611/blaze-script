export interface InterfaceApp{
	mount: Function,
	use: Function
}
export interface InterfaceBlaze{
	runEveryMakeElement: (el: HTMLElement) => void,
	runEveryMakeComponent: (component: Component) => void,
}

export interface NodeDeep{
	key: number,
	el: HTMLElement
}
export interface RegisteryComponent{
	key: number,
	component: Component
}
export interface Watch{
	dependencies: string[],
	handle: Function
}
export interface Mount{
	handle: Function,
	run: boolean
}

export interface Component{
	$h: any,
	$node: HTMLElement,
	$router: any,
	$portal?: string,
	ctx: Object,
	props: Object | any,
	render: Function,
	children: HTMLElement | boolean | any,
	$deep: {
		batch: boolean,
		disableTrigger: boolean,
		disableExtension?: boolean,
		hasMount: boolean,
		update: number,
		node: NodeDeep[],
		registry: RegisteryComponent[],
		watch: Watch[],
		trigger: Function,
		remove: Function,
		dispatch?: any,
		time?: string,
		checking?: Component[],
		disableAddUnmount?: boolean,
		active?: boolean,
		// lifecycle
		mount: Mount[],
		unmount: Function[],
		layout?: Function[],
		created?: Function[],
		beforeUpdate?: Function[],
		updated?: Function[]
	},
	$config?: {
		dev: boolean,
		key?: number
	}
}