// don't remove!
declare global{
    interface Window{
        $app: any,
        $blaze: any,
    }
    interface HTMLElement{
    	if: boolean,
    	childrenComponent: any,
    	childrenCommit: any[],
    	render: boolean,
    	value: any,
    	hasAppend: boolean,
        isRouter: boolean
    }
    interface ChildNode{
    	data: any
    }
}

import "./Apps";