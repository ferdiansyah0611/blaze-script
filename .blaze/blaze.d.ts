export interface InterfaceApp{
	mount: Function,
	use: Function
}
export interface InterfaceBlaze{
	onMakeElement: (value: any) => {},
	runEveryMakeElement: (el: HTMLElement) => void,
	onMakeComponent: (value: any) => {},
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
	ctx: Object,
	props: Object,
	render: Function,
	children: HTMLElement | boolean,
	$deep: {
		batch: boolean,
		disableTrigger: boolean,
		hasMount: boolean,
		update: number,
		node: NodeDeep[],
		registry: RegisteryComponent[],
		watch: Watch[],
		trigger: Function,
		remove: Function
		childrenDiffStatus?: boolean,
		dispatch?: any,
		time?: string,
		// lifecycle
		mount: Mount[],
		unmount: Function[],
		layout?: Function[],
		created?: Function[],
		beforeUpdate?: Function[],
		updated?: Function[]
	},
	$config?: {
		dev: boolean
	}
}