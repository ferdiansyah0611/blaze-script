class Test{
    select: string = ''
    result: string = ''

    constructor(nonactive: boolean = false){
        if(nonactive){
            throw Error('Test is disabled')
        } else {
            console.clear()
        }
    }
    log(msg: string, error: boolean = false){
        var color = (error ? "color: red;": "color: #4bff90;")
        console.log('%cTEST: ' + msg, color)
        return this
    }
    it(...msg: any[]){
        console.log('>', ...msg)
    }
    go(url: string){
        this.log('go ' + url)
        window.$router.history.push(url)
        return this
    }
    value(input: string){
        this.query.value = input
        return this
    }
    use(component: string){
        this.select = component
        return this
    }
    state(){
        console.table(this.query.state)
    }
    get query(): any{
        return document.querySelector(this.select)
    }
    async event(name: any, expect: string){
        this.query[name]()
        await this.wait(50)
        var valid = this.query.innerHTML === expect
        this.log(valid ? 'PASSED!': 'NOT PASSED!', !valid)
        return this
    }
    async wait(time: number){
        await new Promise((resolve) => {
            setTimeout(resolve, time)
        })
        return this
    }
}

export default Test