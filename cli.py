import click, os

@click.group()
def cli():
    pass

@click.command('add:tailwind', short_help='integrate tailwindcss')
def tailwind():
    click.echo("~ integrating tailwindcss to project...")
    # style
    style = open("./src/style/tailwind.sass", "w")
    style.write("@tailwind base\n@tailwind components\n@tailwind utilities")
    style.close()
    click.echo('~ write src/style/tailwind.sass')
    # postcss
    postcss = open("./postcss.config.js", "w")
    postcss.write("module.exports = {\n\tplugins: {\n\t\ttailwindcss: {},\n\t\tautoprefixer: {},\n\t}\n}")
    postcss.close()
    click.echo('~ write ' + "./postcss.config.js")
    # import
    import_style = "import \"./style/tailwind.sass\";\n"
    path_main = "./src/main.ts"
    main = open(path_main, "r")
    value = main.read()
    main.close()
    if value.find(import_style) == -1:
        main = open(path_main, "w")
        main.write(import_style + value)
        main.close()
        click.echo('~ write ' + path_main)

    # install
    click.echo("~ installing...")
    os.system("npm install -D tailwindcss postcss autoprefixer sass && npx tailwindcss init")
    click.echo("~ done")

@click.command('app:create', short_help='create new app')
@click.argument("name")
def createapp(name):
    click.echo("~ create app {}".format(name))
    if not os.path.isdir(name):
        os.makedirs(name)
        directory = ["component", "layout", "lib", "route", "service", "store", "style"]
        directory = map(lambda x: name + "/" + x, directory)
        for directories in directory:
            os.makedirs(directories)

    # main
    main = open(name + "/main.ts", "w")
    source_main = [
        "import \"../global.d\";",
        "import Apps from \"@app/{}/Apps\";".format(name),
        "import { createApp } from \"@root/render\";",
        "\nexport default App(){",
        "\tconst app = new createApp(\"#app\", Apps, {",
        "\t\tdev: import.meta.env.DEV,",
        "\t});",
        "\tapp.mount();",
        "}"
    ]
    source_main = map(lambda x: x + "\n", source_main)
    main.writelines(source_main)
    main.close()
    # Apps
    main = open(name + "/Apps.tsx", "w")
    source_main = [
        "// @ts-nocheck",
        "export default function MyApp() {",
        "\tinit(this, \"auto\");",
        "\tstartIn(this);",
        "\trender(",
        "\t\t() => (",
        "\t\t\t<div className=\"p-4\"><p>Hello World</p></div>",
        "\t\t)",
        "\t)",
        "}",
    ]
    source_main = map(lambda x: x + "\n", source_main)
    main.writelines(source_main)
    main.close()
    click.echo("~ created")

@click.command('app:build', short_help='building application')
def build():
    os.system("npm run build")

@click.command('add:vitest', short_help='integrate vitest')
def vitest():
    click.echo("~ integrating vitest to project...")
    # package
    main = open("./package.json", "r")
    value = main.read().replace('"dev": "vite",', '"dev": "vite",\n\t\t"test": "vitest",')
    main.close()
    main = open("./package.json", "w")
    main.write(value)
    main.close()
    # vite config
    main = open("./vite.config.js", "r")
    value = main.read().replace('import { defineConfig } from "vite";', 'import { defineConfig } from "vitest/config";')
    value = value.replace('plugins: [hmr()],', 'define: {\n\t\t"import.meta.vitest": "undefined",\n\t},\n\ttest: {\n\t\tincludeSource: ["src/**/*.{ts,tsx}", "src/*.{ts,tsx}"]\n\t},' + '\n\tplugins: [hmr()],')
    main.close()
    main = open("./vite.config.js", "w")
    main.write(value)
    main.close()

    os.system("npm i -D vitest")
    click.echo("~ done")

cli.add_command(tailwind)
cli.add_command(createapp)
cli.add_command(build)
cli.add_command(vitest)

if __name__ == '__main__':
    cli()