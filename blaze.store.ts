interface StoreInterface{
    name: string,
    reducers: any,
    registery: any[],
    dispatch: (path: string, payload: any) => any,
    addWatch: (classes: any) => void
}
export class Store implements StoreInterface{
    name: string = 'store'
    reducers: any
    registery: any[]
    constructor(config: any){
        this.reducers = config.reducers
        this.registery = []
        Object.keys(config.reducers).forEach((reducers: any) => {
            this[reducers] = config.reducers[reducers].state
        })
    }
    async dispatch(path: string, payload: any){
        var split: string[] = path.split('.'),
        name: string = split[0],
        action: any = split[1]
        if(this.reducers[name].action[action]){
            await this.reducers[name].action[action](this.reducers[name].state, payload)
            this.registery.forEach((classes: any) => classes.rendered())
        }
    }
    set addWatch(classes: any){
        this.registery.push(classes)
    }
}
export class Schema{
    state: typeof Proxy
    action: any
    constructor(config: any){
        this.state = new Proxy(config.state, {
            get: (a, b) => {
                return a[b]
            },
            set: (a, b, c) => {
                a[b] = c
                return true
            }
        })
        Object.keys(config.action).forEach((action: string) => {
            config.action[action] = config.action[action].bind(this)
        })
        this.action = config.action
    }
}