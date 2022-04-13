declare global{
    interface Window{
        $app: any,
        $router: any,
        store: any,
        runner: any
    }
}
import Handlebars from 'handlebars'
import { Blaze } from '../blaze'
import TestApp from './app.test'
import STORE_APP from './store'
import Template from './Template'

import './style.css'
import "../blaze.component"
import './route/Home'
import './route/User'
import './route/Login'
import './component/Example'

const app = new Blaze({
    root: '#app',
    mode: 'development',
    template: Template,
    role: [
        {
            name: 'user',
            before(){
                var test = localStorage.getItem('isuser')
                if(test){
                    return true
                }
                return '/login'
            }
        },
    ],
    render: (view: string, data: any) => Handlebars.compile(view)(data)
})
app.use(STORE_APP)
app.start(TestApp)