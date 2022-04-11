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