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