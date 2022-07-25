# Computed

Shorten the data or customize the data to the function instance

```tsx
const App = function () {
    const { computed, render } = init(this);
    computed(() => ({
        get: {
            example: () => {
                return "example";
            }
        }
        set: {
            example: (value) => {
                this.ctx.example = value;
            },
        },
        method: {
            clicked: () => {
                console.log("clicked");
            }
        }
    }));
    render(() => <p onClick={this.clicked}>{this.example}</p>);
};
```

Access Computed Out Of Function Component

```tsx
const AppComputed = (computed) => computed(function(){
    return{
        get: {
            example: () => {
                return "example";
            }
        }
        set: {
            example: (value) => {
                this.ctx.example = value;
            },
        },
        method: {
            clicked: () => {
                console.log("clicked");
            }
        }
    }
})

const App = function () {
    const { computed } = init(this);
    AppComputed(computed);
};
```