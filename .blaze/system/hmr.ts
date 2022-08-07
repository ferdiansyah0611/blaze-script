const tsx = /\.tsx$/

export default function hmr() {
  return {
    name: 'transform-file',

    transform(src, id) {
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
        window.$hmr = []
        Object.keys(modules).forEach((mod) => {
          window.$hmr.push(modules[mod]);
        })
        window.$createApp.forEach((app) => {
          app.reload()
        })
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