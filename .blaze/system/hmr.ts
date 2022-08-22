const tsx = /\.tsx$/

export default function hmr() {
  return {
    name: 'transform-file',

    transform(src, id) {
      if(id.indexOf('store') !== -1) {
        src += `
if (import.meta.hot) {
    import.meta.hot.accept((modules) => {
      if(modules) {
        let hmr = []
        Object.keys(modules).forEach((mod) => {
          hmr.push(modules[mod]);
        })
        window.app.forEach((apps) => {
          apps.reload(hmr, true)
        })
      }
    })
}
`
        return {
          code: src,
          map: null
        }
      }
      if (tsx.test(id)) {
        let dependencies = [
          src.match('beforeCreate'),
          src.match('created'),
          src.match('mount'),
          src.match('beforeUpdate'),
          src.match('updated'),
          src.match('layout'),
          src.match('dispatch'),
          src.match('render'),
          src.match('batch'),
          src.match('state'),
          src.match('watch'),
          src.match('effect'),
          src.match('computed'),
          src.match('defineProp'),
        ]
        let text = "";
        let first = true;
        dependencies.forEach((depend, i) => {
          if(depend) {
            if(first) {
              text += depend
              first = false;
            } else {
              text += ", " + depend
            }
          }
        })

        src = src.replaceAll('init(this, "auto");', `const { ${text} } = init(this);`)
        src += `
if (import.meta.hot) {
    import.meta.hot.accept((modules) => {
      if(modules) {
        let hmr = []
        Object.keys(modules).forEach((mod) => {
          hmr.push(modules[mod]);
        })
        window.app.forEach((apps) => {
          apps.reload(hmr)
        })
      }
    });
}`
        return {
          code: src,
          map: null
        }
      }
    }
  }
}