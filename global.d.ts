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
        // system
        $root: any;
        $children: any;
        $name: string;
        // logical optional
        if: boolean;
        else: boolean;
        // events virtual
        events: any[];
        // input
        model: string;
        // auto batch
        batch: boolean;
        // skip different attribute
        diff: boolean;
        // refs of element
        refs: string;
        // auto trigger
        trigger: boolean;
        // key component
        key: string | number;
    }
}

export {};