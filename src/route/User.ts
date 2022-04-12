import E, {
    component
} from '../../blaze'
import user from './user.html?raw';

@component({
    name: 'user-app',
    view: user,
    path: '/user/:id/:name',
    role: 'user'
})
class User extends E{
    constructor(){
        super({
            state: {
                name: 'id',
                click: 0
            },
        })
    }
    static get observedAttributes() {
        return ["name"];
    }
    event(q){
        q('button.logout', 'click', e => {
            localStorage.removeItem('isuser')
            window.$router.history.push('/login')
        })
    }
}