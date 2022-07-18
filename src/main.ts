// don't remove!
declare global{
    interface Window{
        $app: any,
        $blaze: any,
        $extension: any,
        $test: any,
        $router: any,
    }
    interface HTMLElement{
    	if: boolean,
    	childrenComponent: any,
    	childrenCommit: any[],
    	render: boolean,
    	value: any,
    	hasAppend: boolean,
        isRouter: boolean,
        d: any,
        refs?: number,
        i?: number,
        key?: number,
    }
    interface ChildNode{
    	data: any,
        if: boolean
    }
}

import Apps from "@/Apps";

// hmr
if(import.meta.hot) {
    import.meta.hot.accept((modules) => {
        if(modules.default) modules.default();
    })
}

Apps();