const tsx = /(\.tsx|\.jsx)$/

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
        // transform utilites
        src = src.replaceAll('init(this, "auto");', `const { ${text} } = init(this);`)
        // transform store
        if(src.match("store\(.\)")) {
          let store = [...src.matchAll(/store\(('\S+'|"\S+"),\s(\[.+]|\[\])\);/g)];
          if(store.length) {
            store.forEach((stores) => {
              let path = stores[1]
              let allowed = stores[2]
              if(path && allowed) {
                path = path.replaceAll(`"`, '').replaceAll("'", '')
                let name = path;
                if(path.indexOf("/")) {
                  name = path.split("/").at(-1);
                }
                src = `import ${name} from "@/store/${path}";\n` + src
                let findFunction = [...src.matchAll(/init\(this\);/g)]
                if(findFunction.length) {
                  findFunction.forEach((matcher) => {
                    src = src.replace(matcher[0], `${matcher[0]}\n  ${name}(${allowed}, this);`)
                  })
                  src = src.replace(stores[0], '')
                }
              }
            })
          }
        }
        // transform component
        if(src.match(/component\(.+\)/)) {
          let component = [...src.matchAll(/component\((.+)\);/g)];
          if(component.length) {
            component.forEach((components) => {
              let path = components[1]
              if(path) {
                path = path.replaceAll(`"`, '').replaceAll("'", '')
                let name = path;
                if(path.indexOf("/")) {
                  name = path.split("/").at(-1);
                }
                src = `import ${name} from "@/component/${path}";\n` + src;
                src = src.replace(components[0], '')
              }
            })
          }
        }
        // meta hot
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