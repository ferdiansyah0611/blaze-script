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

## svg

SVG element only work in "svg", "path", "g", "circle", "ellipse", "line". But if element nothing in list, you can use attribute `svg=""`.

```tsx
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px"
	 height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
	 <path fill="none" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="
		M35.926,68.357C30.439,64.116,26.906,57.471,26.906,50c0-12.806,10.381-23.188,23.188-23.188c3.202,0,6.252,0.649,9.026,1.822"/>
</svg>
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

## refs

Get current node

```tsx
<section>
	<button refs="btn">btn</button>
	<button refs="mybtn" i={0}>btn 2</button>
</section>

// Access Refs
console.log(this.btn);
console.log(this.mybtn[0]);
```