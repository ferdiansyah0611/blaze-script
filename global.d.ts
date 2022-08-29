declare global {
    interface Window {
        // system
        app: any;
        store: any;
        hmr: any;
        // plugin
        $router: any;
        $error: any;
        $extension: any;
        $test: any;
    }
    interface HTMLElement {
        $children: any;
        $commit: any[];
        $name: string;
        if: boolean;
        else: any;
        value: any;
        events?: any[];
        model?: string;
        batch?: boolean;
        diff?: any;
        refs?: string;
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

export {};