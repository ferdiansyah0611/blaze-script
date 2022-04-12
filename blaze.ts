import { RoutesType, Blazeinterface, BlazeComponent, ComponentDecorationInterface, PropChangeInterface } from './blaze.d'

let $app: Blazeinterface = { param: {}, routes: [] }
let $router, store

window.$app = $app
window.$router = $router
window.store = store

export const log = (...arg: any[]) => window.$app.mode == 'development' ? console.log.call(null, ...arg) : '';
export function component(data: ComponentDecorationInterface): any {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        target.prototype['$name'] = data.name
        if (data.view) {
            target.prototype['$view'] = data.view
        }
        if (data.path) {
            target.prototype['$path'] = data.path
            var push: any = {}
            push.path = data.path
            push.e = target
            $app.routes.push(push)
        }
        if(data.role) {
            target.prototype['$role'] = data.role
        }
        customElements.define(data.name, target)
        return descriptor
    }
}
export function prop(name: string[], action: ((old: string, value: string) => void)): any {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        if (target.prototype.propchange) {
            target.prototype.propchange.push({
                name,
                action: action
            })
        } else {
            target.prototype.propchange = []
            target.prototype.propchange.push({
                name,
                action: action
            })
        }
        return descriptor
    }
}
export function effect(name: string[], action: any): any {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        if (target.prototype.effectchange) {
            target.prototype.effectchange.push({
                name,
                action: action
            })
        } else {
            target.prototype.effectchange = []
            target.prototype.effectchange.push({
                name,
                action: action
            })
        }
        return descriptor
    }
}

export const LISTENER_ROUTE = (root: HTMLElement | HTMLDocument) => root.querySelectorAll('a.route')
    .forEach((el: HTMLElement) => el.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault()
        window.$router.history.push(e['currentTarget']['dataset']['href'])
    })
)

export const LISTENER_INPUT = (keys: any, component: any) => Object.keys(keys).forEach((name: any) => {
    name = keys[name]
    component.querySelectorAll(`${name.path}[name="${name.name}"]`).forEach((el: HTMLElement) => {
        el['value'] = name.value
        el.addEventListener('keyup', (e: KeyboardEvent) => {
            name.value = e['target']['value']
        })
    })
})

export const LISTENER_EVENT = (all: boolean = false, path: string, type: string, call: () => {}, component: any, capture?: boolean) => {
    var addEventListener = (el: HTMLElement) => el && el.addEventListener(type, call, capture)
    return all ? component.querySelectorAll(path).forEach(addEventListener): addEventListener(component.querySelector(path))
}

interface Apps{
    root: string,
    mode: string,
    template: any,
    render: any,
    role: any
}

export class Blaze {
    root: string
    mode: string
    template: any
    render: any
    role: any
    constructor({ root, mode, template, render, role }: Apps) {
        this.root = root
        this.mode = mode
        this.template = template
        this.role = role
        this.render = render
        window.$app = Object.assign(this, window.$app)
    }
    start(callback: () => {} = Function) {
        document.addEventListener('DOMContentLoaded', () => {
            log('DOMContentLoaded')
            var name = this.template.prototype.$name
            var view = `<${name}></${name}>`
            document.querySelector(this.root).innerHTML = view
            LISTENER_ROUTE(document)
            if(this.mode === 'development'){
                setTimeout(callback, 1000)
                window.runner = () => callback()
            }
        })
    }
    use(classes: any) {
        if (classes) {
            window[classes.name] = classes
        }
    }
}
class E extends HTMLElement implements BlazeComponent {
    render: any
    state: any
    propchange: PropChangeInterface[]
    first: boolean
    useStore: boolean
    setState: any
    prop: any
    
    EVENT: any[]
    constructor(config) {
        super()
        var {state, input} = config
        this.first = true
        this.useStore = false
        this.prop = {}
        this.EVENT = []
        this.render = new Proxy({ view: this['$view'], param: this['param'] }, {
            get: (a: any, b: string) => {
                return a[b]
            },
            set: (a: any, b: string, c: any): boolean => {
                a[b] = c
                if (a[b]) {
                    this.rendered()
                }
                return true
            }
        })
        this.state = new Proxy(state, {
            get: (a: any, b: string) => {
                return a[b]
            },
            set: (a: any, b: string, c: any): boolean => {
                a[b] = c
                if (this['effectchange']) {
                    this['effectchange'].filter((v: any) => {
                        if (v.name.find((depend: string) => depend === b)) {
                            v.action = v.action.bind(this)
                            v.action(b)
                        }
                    })
                }
                if (a[b]) {
                    this.rendered()
                }
                return true
            }
        })
        if (input) this['input'] = new Proxy(input, {
            get: (a: any, b: string) => {
                return a[b]
            },
            set: (a: any, b: string, c: any): boolean => {
                a[b] = c
                return true
            }
        })
        this.setState = (name: ((obj: any) => boolean), value?: any) => {
            let set = (obj: any): any => Object.keys(obj).forEach((v: string) => this.state[v] = obj[v])
            if (typeof name === 'function') {
                set(name(this.state))
                return true
            } else if (typeof name === 'object') {
                set(name)
                return true
            } else {
                this.state[name] = value
                return true
            }
        }
        if (this['event']) this['event'] = this['event'].bind(this)
        this.rendered()
    }
    get parseDataRender(){
        var data = {
            state: this.state, prop: this.prop, $app: window.$app
        }
        if(this['input'])       data = Object.assign(data, { input: this['input'] })
        if(this.render.param)   data = Object.assign(data, { param: this.render.param })
        if(this.useStore)       data = Object.assign(data, { store: window.store })
        return data
    }
    async rendered() {
        const { prop, render } = this
        const store = window.store
        let view: string | typeof Promise = ''
        // prop
        this.getAttributeNames().forEach((v: any) => {
            prop[v] = this.getAttribute(v)
        })
        // render
        this.innerHTML = '';
        await (async () => {
            if (typeof render.view === 'object') {
                if (this['lazy'] && this.first) this['lazy']()
                view = await render.view
                view = view['default']
            } else {
                view = render.view
            }
        })()
        if (String(view).indexOf('store') !== -1 && !this.useStore) {
            this.useStore = true
            store.addWatch = this
        }
        // add element
        this.innerHTML = window.$app.render(view || '', this.parseDataRender)
        // event
        LISTENER_ROUTE(this)
        this.addEvent = 1000
        if (this['event']) {
            this['event'](
                (path: string, type: string, call: () => any, capture?: boolean) => {
                    this.addEvent = { path, type, call, capture }
                    return LISTENER_EVENT(false, path, type, call, this, capture)
                },
                (path: string, type: string, call: () => any, capture?: boolean) => {
                    this.addEvent = { path, type, call, capture }
                    return LISTENER_EVENT(true, path, type, call, this, capture)
                }
            )
        }
        if (this['layout']) this['layout']()
        if (this['input']) LISTENER_INPUT(this['input'], this)
    }
    set addEvent(data: any){
        this.EVENT.push(data)
    }
    connectedCallback(): void{
        if (this['mount']) this['mount']()
    }
    disconnectedCallback() {
        this.EVENT.forEach((data: any) => {
            this.querySelectorAll(data.path).forEach((el: any) => {
                el.removeEventListener(data.type, data.call, data.capture)
            })
        })
        if (this['unmount']) this['unmount']()
    }
    attributeChangedCallback(attr: string | object | boolean | any[], old: string | object | boolean | any[], value: string | object | boolean | any[]) {
        if (this.first) {
            this.first = false
        } else {
            if (this.propchange) {
                this.propchange.filter((v: any) => {
                    if (v.name.find((depend: string) => depend === attr)) {
                        v.action = v.action.bind(this)
                        v.action(old, value)
                    }
                })
            }
            this.rendered()
        }
    }
}

export default E