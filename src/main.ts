declare global{
    interface Window{
        $app: any,
        $router: any,
        store: any,
        runner: any
    }
}
import Mustache from 'mustache'
import { Blaze } from '../blaze'
import TestApp from './app.test'
import STORE_APP from './store'
import Template from './Template'

import './style.css'
import "../blaze.component"
import './route/Home'
import './route/User'
import './component/Example'

const app = new Blaze({
    root: '#app',
    mode: 'development',
    template: Template,
    role: [
        {
            name: 'user',
            before(){
                return false
            }
        },
        {
            name: 'admin',
            before(){
                return '/login'
            }
        },
    ],
    render: (view: string, data: any) => Mustache.render(view, data)
})
app.use(STORE_APP)
app.start(TestApp)