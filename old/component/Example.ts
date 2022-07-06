import E, {
    component, log, effect, prop
} from '../../blaze'

@component({
    name: 'example-app',
    view: import('./example.html?raw')
})
@effect(['click'], function(depend: any){
    console.log(depend, 'effect')
})
@prop(['name'], function(old: string, value: string){
    console.log(old, value, 'change')
})
class Example extends E{
    constructor(){
        super({
            state: {
                name: 'ferdy',
                click: 0
            },
            input: {
                job: { name: 'username', value: 'ferdiansyah' }
            }
        })
    }
    static get observedAttributes() {
        return ["name"];
    }
    lazy(){
        // log('loading')
    }
    layout(){
        // log('effect')
    }
    mount(){
        // log('mount')
    }
    event(q: any){
        q('button', 'click', () => {
            this.setState((state: any) => ({
                name: 'safina ' + state.click,
                click: state.click + 1
            }))
        })
    }
    unmount(){
        log('unmount')
    }
}