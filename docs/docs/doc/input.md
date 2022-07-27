# Model Input

Auto handling input with max 5 deep object and can trigger manually.

```tsx
<div>
    <input type="text" model="state.name" trigger={0} placeholder="Name" />
    <input type="text" model="state.sub.name" trigger={1} placeholder="Name" />
    <input type="text" model="state.sub.sub2.name" trigger={1} placeholder="Name" />
    <input type="text" model="state.sub.sub2.sub3.name" trigger={1} placeholder="Name" />
</div>
```

Same as

```tsx
<div>
    <input type="text" onChangeValue={(value) => (this.state.name = value)} placeholder="Name" />
    <input type="text" onChangeValue={(value) => (this.state.sub.name = value)} placeholder="Name" />
    <input type="text" onChangeValue={(value) => (this.state.sub.sub2.name = value)} placeholder="Name" />
    <input type="text" onChangeValue={(value) => (this.state.sub.sub2.sub3name = value)} placeholder="Name" />
</div>
```
