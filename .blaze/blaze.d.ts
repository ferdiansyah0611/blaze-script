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
	$deep: {
		$id: number,
		batch: boolean,
		disableTrigger: boolean,
		hasMount: boolean,
		update: number,
		node: NodeDeep[],
		registry: RegisteryComponent[],
		watch: Watch[],
		mount: Mount[],
		unmount: Function[],
		trigger: Function,
		remove: Function
		childrenDiffStatus?: boolean,
		dispatch?: any,
	},
	$config?: {
		dev: boolean
	}
}