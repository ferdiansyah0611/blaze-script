// don't remove!
declare global {
    interface Window {
        $app: any;
        $blaze: any;
        $extension: any;
        $test: any;
        $router: any;
        $error: any;
    }
    interface HTMLElement {
        $children: any;
        $commit: any[];
        $name: string;
        if: boolean;
        else: any;
        render: boolean;
        value: any;
        hasAppend: boolean;
        isRouter: boolean;
        d?: any;
        refs?: number;
        i?: any;
        key?: any;
        $index?: number;
        $root?: any;
        updating?: boolean;
    }
    interface ChildNode {
        data: any;
    }
    interface URLSearchParams {
        entries();
    }
}

import Apps from "@/Apps";

// hmr
if (import.meta.hot) {
    import.meta.hot.accept((modules) => {
        if (modules.default) modules.default();
    });
}

Apps();
