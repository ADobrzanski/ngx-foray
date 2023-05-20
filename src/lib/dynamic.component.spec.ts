import { ChangeDetectorRef, DebugElement, Type, ViewRef } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DynamicComponentsModule } from './lib.module';
import { By } from "@angular/platform-browser";
import { LifecycleComponent, LifecycleHook, useLifecycleComponent } from './test/lifecycle.component';
import { DefaultCDHostComponent } from './test/default-cd-host.component';
import { TestSimpleComponent, useTestSimpleComponent } from './test/simple.component';

describe('DynamicComponent', () => {
    let wrapper: DefaultCDHostComponent;
    let fixture: ComponentFixture<DefaultCDHostComponent>;
    const queryComponent = (type: Type<any>): DebugElement | null => fixture?.debugElement.query(By.directive(type));
    const queryComponentInstance = <T>(type: Type<T>) => queryComponent(type)?.componentInstance as T | null;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            declarations: [TestSimpleComponent, DefaultCDHostComponent],
            imports: [DynamicComponentsModule],
        });

        fixture = TestBed.createComponent(DefaultCDHostComponent);
        wrapper = fixture.componentInstance;
    })

    it('should render provided component', async () => {
        wrapper.dynamic = useLifecycleComponent({}).container;

        fixture.detectChanges();

        expect(queryComponent(LifecycleComponent)).toBeTruthy();
    });

    describe('lifecycle hooks', () => {
        const hookCalledTestCases = [
            { hook: LifecycleHook.OnChanges, name: 'ngOnChanges' },
            { hook: LifecycleHook.OnInit, name: 'ngOnInit' },
            { hook: LifecycleHook.DoCheck, name: 'ngDoCheck' },
            { hook: LifecycleHook.AfterViewChecked, name: 'ngAfterViewChecked' },
            { hook: LifecycleHook.AfterViewInit, name: 'ngAfterViewInit' },
            { hook: LifecycleHook.AfterContentChecked, name: 'ngAfterContentChecked' },
            { hook: LifecycleHook.AfterContentInit, name: 'ngAfterContentInit' },
        ];

        const hookCalledTest = (testCase: typeof hookCalledTestCases[number]) =>
            it(`${testCase.name} is called`, () => {
                wrapper.dynamic = useLifecycleComponent({}).container;
                fixture.detectChanges();

                const componentInstance = queryComponentInstance(LifecycleComponent);
                const hasHookBeenCalled = (hook: LifecycleHook) => componentInstance?.hooksTrace.map(_ => _[0]).includes(hook);

                expect(hasHookBeenCalled(testCase.hook)).toBe(true);
            });

        hookCalledTestCases.forEach(hookCalledTest);

        it('ngOnDestroy is called', () => {
            wrapper.dynamic = useLifecycleComponent({}).container;
            fixture.detectChanges();

            const componentInstance = queryComponentInstance(LifecycleComponent);
            const hasHookBeenCalled = (hook: LifecycleHook) => componentInstance?.hooksTrace.map(_ => _[0]).includes(hook);

            wrapper.dynamic = undefined;
            fixture.detectChanges();

            expect(hasHookBeenCalled(LifecycleHook.OnDestroy)).toBe(true);
        });

        it('are called in "natural" order', () => {
            wrapper.dynamic = useLifecycleComponent({}).container;
            fixture.detectChanges();

            const componentInstance = queryComponentInstance(LifecycleComponent);

            /* destroy component to invoke onDestroy */
            wrapper.dynamic = undefined;
            fixture.detectChanges();

            const expectedHookOrder = [
                LifecycleHook.OnChanges,
                LifecycleHook.OnInit,
                LifecycleHook.DoCheck,
                LifecycleHook.AfterContentInit,
                LifecycleHook.AfterContentChecked,
                LifecycleHook.AfterViewInit,
                LifecycleHook.AfterViewChecked,
                LifecycleHook.OnDestroy,
            ];

            const hookOrder = componentInstance?.hooksTrace.map(_ => _[0]);

            expect(hookOrder).toEqual(expectedHookOrder);
        });
    })

    it('should update binding when provided with new container for the same component', () => {
        const containerInitial = useTestSimpleComponent({ simpleInput: 'first' }).container;
        wrapper.dynamic = containerInitial;
        fixture.detectChanges();

        const component = queryComponent(TestSimpleComponent);
        const onDestroySpy = jasmine.createSpy();
        (component?.injector.get(ChangeDetectorRef) as ViewRef).onDestroy(onDestroySpy);

        const containerNew = useTestSimpleComponent({ simpleInput: 'new' }).container;
        wrapper.dynamic = containerNew;
        fixture.detectChanges();

        expect(onDestroySpy).not.toHaveBeenCalled();
    });

    describe('using binding object', () => {
        it('should feed input with provided value', () => {
            const simpleInput = 'Some text to be displayed';
            wrapper.dynamic = useTestSimpleComponent({ simpleInput }).container;
            fixture.detectChanges();

            const component = queryComponent(TestSimpleComponent);
            expect(component?.nativeElement.textContent).toContain(simpleInput);
        });

        it('should bind provided event handler', () => {
            const simpleOutputHandler = jasmine.createSpy();
            wrapper.dynamic = useTestSimpleComponent({ simpleOutput: simpleOutputHandler }).container;
            fixture.detectChanges();

            queryComponent(TestSimpleComponent)?.triggerEventHandler('click', null);

            expect(simpleOutputHandler).toHaveBeenCalled();
        });

        it('should detect changes made to the provided reference', () => {
            let binding = { simpleInput: 'Some text to be displayed' };
            wrapper.dynamic = useTestSimpleComponent(binding).container;
            fixture.detectChanges();

            const nextValue = 'Some other text provided later';
            binding.simpleInput = nextValue;
            fixture.detectChanges();

            const component = queryComponent(TestSimpleComponent);
            expect(component?.nativeElement.textContent).toContain(nextValue);
        });
    });

    describe('using binding factory function', () => {
        it('should feed input with provided value', () => {
            const simpleInput = 'Some text to be displayed';
            wrapper.dynamic = useTestSimpleComponent(() => ({ simpleInput })).container;
            fixture.detectChanges();

            const component = queryComponent(TestSimpleComponent);
            expect(component?.nativeElement.textContent).toContain(simpleInput);
        });

        it('should update input when bound property changes', () => {
            let simpleInput = 'Some text to be displayed';
            wrapper.dynamic = useTestSimpleComponent(() => ({ simpleInput })).container;
            fixture.detectChanges();

            const nextValue = 'Some other text provided later';
            simpleInput = nextValue;
            fixture.detectChanges();

            const component = queryComponent(TestSimpleComponent);
            expect(component?.nativeElement.textContent).toContain(nextValue);
        });

        it('should bind provided event handler', () => {
            const simpleOutputHandler = jasmine.createSpy();
            wrapper.dynamic = useTestSimpleComponent(() => ({ simpleOutput: simpleOutputHandler })).container;
            fixture.detectChanges();

            queryComponent(TestSimpleComponent)?.triggerEventHandler('click', null);

            expect(simpleOutputHandler).toHaveBeenCalled();
        });
    });

})