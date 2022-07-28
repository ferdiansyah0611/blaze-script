# Blaze API

```tsx
const keyApp = 0;
const blaze = window.$app[keyApp];
```

## everyMakeElement

```tsx
blaze.everyMakeElement.push((el) => {
	console.log(el);
});
```

## everyMakeComponent

```tsx
blaze.everyMakeComponent.push((component) => {
	console.log(component);
});
```

## afterAppReady

```tsx
blaze.afterAppReady.push((component) => {
	console.log(component);
});
```

## startComponent

```tsx
blaze.startComponent.push((el) => {
	console.log(el);
});
```

## endComponent

```tsx
blaze.endComponent.push((component) => {
	console.log(component);
});
```

## onReload

```tsx
blaze.onReload.push((component) => {
	console.log(component);
});
```
