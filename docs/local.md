# Local

localStorage Plugin for Component

```tsx
const setUser = local("user", this);

const change = () => setUser("hi, " + Math.random(1000))
const change2 = () => setUser((previous) => previous + ". hi, " + Math.random(1000))

console.log(this.local.user)
```