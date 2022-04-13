# Blaze Script
Lightweight Single Page Application using Vite & Typescript.
## Feature
- Real DOM
- Include Router and State Management
- Customize Rendering Like a EJS, PUG, Mustache, Handlebars and More Library
- Only 19.01 KiB / gzip: 7.18 KiB

## Get Started
```typescript
// main.ts
import Handlebars from 'handlebars'
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
    render: (view: string, data: any) => Handlebars.render(view, data)
})
app.use(STORE_APP)
app.start(TestApp)
```
## Create New Component
```typescript
import E, {
    component, log, effect, prop
} from '../../blaze'

@component({
    name: 'example-app',
    view: import('./example.html?raw')
})
class Example extends E{
    constructor(){
        super({
            state: {
                name: 'ferdy'
            }
        })
    }
    static get observedAttributes() {
        return ["name"];
    }
}
```
```html
<!-- example.html -->
<div>
    <p>Hi, I'm {{state.name}}</p>
    <p>Call runner() on console to run testing!</p>
    <input name="job" type="text" placeholder="Hello World" />
</div>
```
And you can use component anything without import
```html
<example-app></example-app>
```
## Create Route Template
```typescript
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
```
```html
<div class="template">
    <nav class="flex">
        <a href="/" data-href="/" class="route">Route Home</a>
        <a href="/user/1/ferdi" data-href="/user/1/ferdi" class="route">Route User</a>
    </nav>
    <blaze-route></blaze-route>
</div>
```
## Create New Pages
```typescript
@component({
    name: 'example-app',
    view: example,
    path: '/',
    // role: 'user'
})
class Home extends E{
    constructor(){
        super({
            state: {
                name: 'ferdy'
            }
        })
    }
    static get observedAttributes() {
        return ["name"];
    }
}
```
## Lifecycle Method
```typescript
class Example extends E{
    mount(){
        log('mount component')
    }
    unmount(){
        log('unmount component')
    }
    layout(){
        log('layout effect')
    }
    event(query: any, queryAll: any){
        // add event in here
        query('button', 'click', () => {
            this.setState((state: any) => ({
                click: state.click + 1
            }))
        })
        // query is querySelector (on this component)
        // queryAll is querySelectorAll (on this component)
    }
    lazy(){
        log('lazy loading...')
    }
}
```
## Watching State & Prop
```typescript
@component({
    name: 'example-app',
    view: import('./example.html?raw')
})
@effect(['username'], function(depend: any){
    console.log(depend)
})
@prop(['name'], function(old: string, value: string){
    console.log(old, value)
})
class Example extends E{
    constructor(){
        super({
            state: {
                username: 'ferdiansyah'
            }
        })
    }
    static get observedAttributes() {
        return ['name'];
    }
}
```
## Handling Input
```typescript
class Example extends E{
    constructor(){
        super({
            state: {},
            // autocontrolled input
            input: {
                job: { name: 'job', value: 'software engineer', path: 'input' },
                username: { name: 'username', value: 'ferdiansyah', path: 'input' },
            }
        })
        // accessing input
        var {job, username} = this.getInput(['job', 'username']).json()
        log(job, ',', username) // software engineer, ferdiansyah
        // set input
        this.setInput('job', 'accounting').setInput('username', 'ferdiansyah')
    }
}
```
## Router Method
```typescript
$router.history.push('/home')
```
## State Management
```html
<p>Hi, I'm {{store.app.name}}</p>
```
```typescript
import {
    Store, Schema
} from '../blaze.store'

// state management
const myapp = new Schema({
    state: {
        name: 'ferdiansyah'
    },
    action: {
        handle(state: any, payload: any){
            state.name = payload.name
        }
    }
})
const STORE_APP = new Store({
    reducers: {
        app: myapp
    }
})
export default STORE_APP
```
```typescript
store.dispatch('app.handle', {name: 'safina sahda'})
```
## Testing Example
```typescript
// src/app.test.ts
import Test from '../blaze-test'

export default async function TestApp(){
    const test = new Test()
    const click = async () => {
        test.it('TEST 1')
        await test.go('/login').wait(500)
        await test.use('login-app button').event('click', null)
        await test.go('/').wait(500)
        for(var i = 1; i < 5; i++){
            await test.use('example-app button').event('click', i + ' Click')
            test.use('example-app').value('job', 'input', 'ferdiansyah ' + i)
            await test.wait(500)
        }
        await test.go('/user/1/ferdi').wait(500)
        await test.use('user-app button').event('click', null)
        test.endIt()
    }
    await click()
}
```
## Declaration
```typescript
declare global{
    interface Window{
        $app: any,
        $router: any,
        store: any,
        runner: any
    }
}
```