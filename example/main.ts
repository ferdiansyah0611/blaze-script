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
        else: any,
        $name: string,
        $children: any,
        $commit: any[],
        render: boolean,
        value: any,
        hasAppend: boolean,
        isRouter: boolean,
        d: any,
        refs?: number,
        i?: number,
        key?: number,
        $index?: number
        $root?: any
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