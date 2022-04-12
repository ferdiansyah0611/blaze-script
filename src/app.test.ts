import Test from '../blaze-test'

export default async function TestApp(){
    // test
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