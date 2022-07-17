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
    	data: any,
        if: boolean
    }
}

import Apps from "./Apps";

if(import.meta.hot) {
    import.meta.hot.accept((modules) => {
        if(modules.default) modules.default()
    })
}

Apps();