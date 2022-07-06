// template
import E, {
    component, log
} from '../blaze'
import template from './template.html?raw'

@component({
    name: 'template-app',
    view: template,
})
class Template extends E{
    constructor(){
        super({
            state: {},
        })
    }
    mount(){
        log('template')
        var i = 0;
        var int = setInterval(() => {
            window.store.dispatch('app.handle', {
                name: 'ferdiansyah' + i
            })
            i++
            if(i === 10){
                clearInterval(int)
            }
        }, 1000)
    }
}
@component({
    name: 'app-404',
    view: '404'
})
class NotFound extends E{
    constructor(){
        super({
            state: {},
        })
    }
    async mount(){
        log('mount')
    }
}

export default Template