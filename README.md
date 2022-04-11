# Blaze Script
Lightweight Single Page Application using Vite & Typescript.
## Feature
- Not Virtual DOM
- Include Router and State Management
- Customize Rendering Like a EJS, PUG, Mustache and More Library
- Only 19.01 KiB / gzip: 7.18 KiB

## Get Started
```typescript
// main.ts
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
    event(query, queryAll){
        // add event in here
        query('button', 'click', () => {
            this.setState((state: any) => ({
                click: state.click + 1
            }))
        })
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
                job: { name: 'job', value: 'software engineer', path: 'input' }
            }
        })
        // accessing input
        log(this.input.job.value)
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
    // test
    const test = new Test(true).go('/user/1/ferdi')
    await test.wait(100)
    await test.go('/')
    await test.wait(100)
    test.it('CLICK TESTER')
    await test.use('example-app button').event('click', '1 Click')
    for(var i = 1; i < 20; i++){
        await test.use('example-app button').event('click', i + 1 + ' Click')
        test.use('example-app input').value('ferdiansyah ' + i)
        await test.wait(100)
    }
    test.use('example-app').state()
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