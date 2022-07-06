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
            state: {},
        })
    }
    event(q){
        q('button.logout', 'click', e => {
            localStorage.removeItem('isuser')
            window.$router.history.push('/login')
        })
    }
}