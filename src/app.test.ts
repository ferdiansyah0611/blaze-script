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