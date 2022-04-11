export type RoutesType = {
    path: string,
    e: any
}

export interface Blazeinterface{
    root?: string,
    mode?: string,
    routes: RoutesType[],
    template?: string | any,
    start?: () => void,
    param: any,
}

export interface BlazeComponent {
    $name?: string,
    first: boolean,
    useStore?: boolean,
    EVENT: any[],
    state: any,
    prop?: any,
    setState(name: string | (() => any), value?: string),
    rendered: () => {},
    connectedCallback?: () => void,
    disconnectedCallback?: () => void,
    attributeChangedCallback?: (attr: any, old: any, value: any) => void,
    mount?: () => void,
    unmount?: () => void,
    event?: (q: any, qa: any) => void,
    render?: any
    layout?: any
    propchange?: any

    popstate?: boolean,
    readonly history?: any,
    readonly route?: any,
}

export interface ComponentDecorationInterface{
    name: string,
    view?: any,
    path?: string,
    role?: string,
}
export interface PropChangeInterface{
    name: string,
    action: ((old: string, value: string) => void)
}