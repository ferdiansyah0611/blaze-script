# Lifecycle

lifecycle on blaze script

```tsx
const App = function () {
	const { beforeCreate, created, mount, layout, beforeUpdate, updated } = init(this);
}
```

## beforeCreate

Before render called

```tsx
beforeCreate(() => {
    console.log("beforeCreate effect");
});
```

## created

Component has created, where function render on called

```tsx
created(() => {
    console.log("created effect");
});
```

## mount & unmount

DOM has ready

```tsx
mount(() => {
    console.log("mount effect");
    return() => {
    	console.log("unmount effect");
    }
});
```

## layout

Run every render is run

```tsx
layout(() => {
    console.log("layout effect");
});
```

## beforeUpdate

Before state or context changes

```tsx
beforeUpdate(() => {
    console.log("beforeUpdate effect");
});
```

## updated

After state or context has changes

```tsx
updated(() => {
    console.log("updated effect");
});
```