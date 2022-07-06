export interface NodeDeep = {
	key: number,
	el: HTMLElement
}
export interface RegisteryComponent = {
	key: number,
	component: Component
}
export interface Watch = {
	dependencies: string[],
	handle: Function
}
export interface Mount = {
	dependencies: string[],
	handle: Function
}

export interface Component = {
	ctx: Object,
	props: Object,
	$h: any,
	render: Function,
	$deep: {
		update: number,
		batch: boolean,
		node: NodeDeep[],
		registry: RegisteryComponent[],
		watch: Watch[],
		mount: Mount[],
		unmount: Function[],
		trigger: Function,
		remove: Function
	}
}