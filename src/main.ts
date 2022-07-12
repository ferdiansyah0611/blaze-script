// don't remove!
declare global{
    interface Window{
        $app: any,
        $blaze: any,
        $extension: any
    }
    interface HTMLElement{
    	if: boolean,
    	childrenComponent: any,
    	childrenCommit: any[],
    	render: boolean,
    	value: any,
    	hasAppend: boolean,
        isRouter: boolean,
        d: any
    }
    interface ChildNode{
    	data: any,
        if: boolean
    }
}

import "@/Apps";