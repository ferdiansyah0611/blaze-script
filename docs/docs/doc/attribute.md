# Attribute

## style

Work on string or object

```tsx
<section>
	<div style="display: none;"></div>
	<div style={{ display: "none" }}></div>
</section>
```

## class

Can use class or className, if array the class automatically join as a string

```tsx
<section>
	<div class="flex"></div>
	<div className="flex"></div>
	{/*auto join*/}
	<div className={["flex", "justify-center"]}></div>
</section>
```

## setHTML

By default, setHTML auto escaping for security

```tsx
<section>
	<section setHTML="<p>Hello World</p>"></section>
</section>
```

## if & else

Logical optional

```tsx
<section>
	<div class="text-white">
		<p if={true}>true</p>
		<p else>false</p>
	</div>
</section>
```

## show

Like a display block or none

```tsx
<section>
	<div show={true}>
		<p>I'm show element</p>
	</div>
</section>
```

## toggle

Event listener reverse for a state or context

```tsx
<section>
	<button toggle="state.open">toggle</button>
</section>
```
