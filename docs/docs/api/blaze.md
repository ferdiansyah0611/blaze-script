# Blaze API

```tsx
const keyApp = 0;
const blaze = window.$app[keyApp];
```

## everyMakeElement

```tsx
blaze.everyMakeElement.push((el) => {
	console.log(el);
})
```

## everyMakeComponent

```tsx
blaze.everyMakeComponent.push((component) => {
	console.log(component);
})
```

## afterAppReady

```tsx
blaze.afterAppReady.push((component) => {
	console.log(component);
})
```