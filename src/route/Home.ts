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
                click: 0
            },
        })
    }
    async mount(){
        log('mount')
    }
}