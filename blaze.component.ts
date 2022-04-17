import E, {
    component, log, Blaze, prop
} from './blaze'

@component({
    name: 'blaze-route',
    view: ''
})
class BlazeRouter extends E{
    popstate: boolean
    constructor(){
        super({
            state: {},
        })
        this.popstate = false
        window.$router = this
    }
    mount(){
        this.route.ready()
        window.addEventListener('popstate', () => {
            this.popstate = true
            this.route.ready(location.pathname)
        });
    }
    get history(){
        const { route } = this
        return{
            push: (url: string) => {
                if(!(url === location.pathname)){
                    route.ready(url)
                }
            },
            back: () => {
                history.back()
            },
            go: (num: number) => {
                history.go(num)
            }
        }
    }
    get route(){
        const goto = (url: string, name: string) => {
            if(this.popstate){
                history.replaceState(null, '', url)
            } else {
                history.pushState(null, '', url)
            }
            this.popstate = false
            this.render.view = `<${name}></${name}>`
        }
        return{
            ready: (url: string = new URL(location.href).pathname) => {
                let routes = window.$app.routes.find((v: any) => v.path === url), name: string = "", found: any
                const validation = () => {
                    if(routes){
                        name = routes.e.prototype.$name
                        found = routes
                        return true
                    } else {
                        const pathRegex = (path: string) => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$")
                        const potentialMatched = window.$app.routes.map((route: any) => {
                            return {
                                route,
                                result: url.match(pathRegex(route.path))
                            }
                        })
                        let match = potentialMatched.find((potentialMatch: any) => potentialMatch.result !== null)
                        if (!match) {
                            if(routes){
                                match = {
                                    route: routes[0],
                                    result: [url]
                                }
                            } else {
                                name = 'app-404'
                                match = {
                                    route: {
                                        path: '',
                                        e: customElements.get('app-404')
                                    }
                                }
                                found = false
                                console.warn(url + ': 404 PAGES! use tag <app-404></app-404>')
                                goto(url, name)
                                return false
                            }
                        }
                        const getParams = (match: any) => {
                            const values = match.result.slice(1);
                            const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map((result: any) => result[1])
                            return Object.fromEntries(keys.map((key: any, i: number) => {
                                return [key, values[i]]
                            }))
                        }
                        name = match.route.e.prototype.$name
                        match.route.e.prototype.param = getParams(match)
                        found = match.route
                        return true
                    } 
                }
                if(validation()){
                    var classes = found ? found.e.prototype: {}
                    if (window.window.$app.role && classes.$role) {
                        var role = window.window.$app.role.find((v: any ) => v.name === classes.$role)
                        if(role){
                            var before = role.before()
                            if(typeof before === 'string') {
                                return this.history.push(before)
                            }
                            else if(before === false) return true
                            else {
                                return goto(url, name)
                            }
                        } else {
                            return goto(url, name)
                        }
                    } else {
                        return goto(url, name)
                    }
                    
                }
            }
        }
    }
}