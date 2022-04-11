import E, {
    component, log
} from '../../blaze'
import home from './home.html?raw';

@component({
    name: 'home-app',
    view: home,
    path: '/'
})
class Home extends E{
    constructor(){
        super({
            state: {
                name: 'ferdy',
                click: 0
            },
        })
    }
    static get observedAttributes() {
        return ["name"];
    }
    async mount(){
        log('mount')
    }
}