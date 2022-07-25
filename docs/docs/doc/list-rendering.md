# List Rendering

Support jsx map array to render.

```tsx
<div>
    {this.state.user.map((item: any) => (
        <div>
            <p>{item.username}</p>
        </div>
    ))}
</div>
```

In the blaze, use attribute "for" at parent and attribute "key" at children to customize map data without replacing children on updating data array.

```tsx
<div for>
    {this.state.user.map((item: any) => (
        <div key={item.id}>
            <p>{item.username}</p>
        </div>
    ))}
</div>
```