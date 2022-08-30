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
    interface Element {
        // root component
        $root: any;
        // current component
        $children: any;
        $name: string;
        // logical optional
        if: boolean;
        else: any;
        // events virtual
        events: any[];
        // input
        model: string;
        // auto batch
        batch: boolean;
        // skip different attribute
        diff: any;
        // refs of element
        refs: string;
        // auto trigger
        trigger: any;
        // key
        i: any;
        key: any;
    }
    interface ChildNode {
        data: any;
    }
    interface URLSearchParams {
        entries();
    }
}

export {};