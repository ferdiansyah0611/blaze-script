import E, {
    component, log
} from '../../blaze'
import login from './login.html?raw';

@component({
    name: 'login-app',
    view: login,
    path: '/login'
})
class Login extends E{
    constructor(){
        super({
            state: {
                name: 'ferdy',
                click: 0
            },
            input: {
                name: { name: 'name', value: '', path: 'input'},
                password: { name: 'password', value: '', path: 'input'},
            }
        })
    }
    event(q){
        q('button', 'click', (e) => {
            localStorage.setItem('isuser', "ok")
            window.$router.history.push('/user/1/ferdy')
        })
    }
}