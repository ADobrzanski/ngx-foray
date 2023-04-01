# ngx-foray

Low cost type-safe bindings for better dynamic components

`ngx-foray` emulates template bindings for dynamically created components in a type-safe manner and with smallest possible setup.

## Features

- input, output binding
    - based on class property names
    - types inferred from component's definition
- `[formControl]` directive binding
- CSS class bindings

## Compatibility

At the moment library is being developed and used with Angular 12 but I **suspect** it might work just fine with up to Angular 15. This will get tested and `peerDependencies` will get adjusted.

## Installation

Install package by running command below in your terminal.

```
npm i ngx-foray
```

## Setup

### Component definition

> Due to the nature of decorators information about class property being an `@Input()` is not known to Typescript. This step is about bringing this information into type system.

We will use [primeng's](https://www.primefaces.org/) [Slider component](https://www.primefaces.org/primeng-v12-lts/#/slider) as an example.

```
import { makeComponentDefinition } from 'ngx-foray';
import { Slider } from 'primeng/slider'; // component of choice

const sliderDefinition = makeComponentDefinition({
    classRef: Slider,
    inputs: ['animate', 'disabled', 'min', 'max', ... ]
})
```

### Basic inputs and event handlers

When using ngx-foray you can provide input values and event handlers for dynamically rendered components. An object containing those values and handlers is referred to as "binding" and follows the shape of an example below.

```
const binding = {
    inputPropertyName: inputPropertyValue,
    ...,
    eventEmitterPropertyName: eventHandler,
}
```

For this binding to be properly typed component definition (see [Component definition](./README.md#component-definition)) is used.

```
const slider = useComponent(
    sliderDefinition, // see step before
    {
        min: 0,
        max: 100,
        onSlideEnd: (e) => { console.log(`Value of ${e.value} was set`); }
    }
);
```

The call above returns object with a prop `container` of type `DynamicComponentContainer`. Is is a "bundle" of component's class ref and provided bindings, not a component's instance yet. You can think of it as a class with new default property values.

`[ngxDynamicComponent]` directive accepts `DynamicComponentContainer`, spawns bundled component and binds inputs and handlers.

```
<ng-container [ngxDynamicComponent]="slider.container"></ng-container>
```

All the steps above will have similar effect to the sippet below.

```
<p-slider
    min="0"
    max="100"
    (onSlideEnd)="console.log(`Value of ${$event.value} was set`)"
></p-slider>
```

> I am aware that the console.log() would not work within template. This is only for illustration purposes.

### Note on `[ngxDynamicComponent]` directive and `DynamicComponentContainer`

Providing new `DynamicComponentContainer` with the same component class ref but different bindings will result in change detection, not a complete rerender.

About `DynamicComponentContainer` you should note it hides the information about described component. What it allows for is use of different components' containers within `Array` or `Record` like so:

```
const tableColumns = [
    { title: 'Name', display: row => useComponent(textCellDefinition, { text: row.name }) },
    { title: 'Progress', display: row => useComponent(sliderDefinition, { value: row.completionLevel, min: 0, max: 100 }) },
]
```

The vision of example above is what inspired me to explore dynamic components in the first place. I hope you are as excited as I am because there is more of what `ngx-foray` can do.

## Advanced examples

For advanced examples please browse 