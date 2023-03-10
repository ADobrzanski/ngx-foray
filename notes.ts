//  - immediate reaction
//  - minimal data load
//  - minimal ui paint
//  - full data load
//  - full ui paint

//  problems:
//  (almost) identical forms with different behaviors -> one form with toggles
class Component {
    dataLoading = false;

    dataSending = false;

    constructor(
        readonly private injector: Injector,
        readonly private cdr: ChangeDetectorRef,
        readonly private presetService: PresetService,
    ) { }

    ngOnInit() {
        // proxy for immediate detectChangesCall()
        this.cdh = this.cdhFactory(this.cdr, this);

        this.cdh.dataLoading = true;
    }

    private setup(): void {
        this.subs.sink = this.route.params.
    }

    private initDirectionInput(): Observable<void> {

    }
}

/**
 * current issues:
 * - component set duplication (encapsulation)
 * - init logic duplication (no way to tell if comp init is complete; parent should do the init part to keep track of it)
 * 
 * 
 */

// BE validation handling:
/**
 * template:
 * <app-loader-overlay *ngIf="loaderVisible"></app-loader-overlay>
 * 
 * <app-db-validation-result [validationResult]="validationResult"></app-db-validation-result>
 * 
 * <app-dynamic-list [config]="formConfig"></app-dynamic-list>
 * 
 * <div class="footer-button-section" >
 *  <app-dynamic-list [config]="actionButtons"></app-dynamic-list>
 * </div>
 * 
 * template no-dynamic:
 * <app-loader-overlay *ngIf="loaderVisible"></app-loader-overlay>
 * 
 * 
 * 
 * // ------------------------------------------------------------------------------
 * // not as short as with dynamic components, buuuut... 50% reduction in line-count
 * <input-wrapper id="direction" label="Kierunek">
 *      <app-select [formControl]="form.get('direction')" [items]="directionSelectItems | async | pluck('value') ">
 *      </app-select>
 * </input-wrapper>
 * 
 * // vs
 * 
 * <div class="o-form-group">
 *      <label [for]="idPrefix + 'direction'">Kierunek</label>
 *      <app-select
 *          [id]="idPrefix + 'direction'"
 *          [formControl]="form.get('direction')"
 *          [items]="directionSelectItems | async | pluck('value')">
 *      </app-select>
 * </div>
 * // ------------------------------------------------------------------------------
 * 
 * class Comp {
 *  loaderVisible = false;
 * 
 *  // view logic
 *  validationResult?: DBValidationResult;
 * 
 *  // higher logic (maps into view logic)
 *  canForceSave
 * 
 *  formConfig = {
 *      documentId: useAppInput({ label: 'Document id:' }),
 *      //documentType: useDocumentTypeSelect(), // deep preset/with popular defaults
 *      documentType: useSelect({ label: 'Rodzaj' }),
 *      direction: useSelect({ label: 'Kierunek' }),
 *      someValue: useAppInput({ label: 'Some value' }),
 *  }
 * 
 *  manualHandling = {
 *      onlyRequest: useToggle({ label: 'Send only request' }),
 *  }
 *
 *  // ?? how into visibility? removing from list drops state :/
 *  actionButtons = {
 *      forceSave: useButton({ text: 'Force save' }, { hidden: true }), // optional cfg?
 *      save: useButton({ text: 'Save' }),
 *  }
 * 
 *  constructor(
 *      readonly private apiService: ApiService,
 *      readonly private dictionaryService: dictionaryService,
 *  )
 * 
 *  ngOnInit() {
 *      const { documentType } = this.formConfig;
 *      documentType.items = this.dictionaryService.getDocumentTypeSelectItems().pipe(withLoading());
 *      direction.items = this.dictionaryService.getDirectionSelectItems().pipe(withLoading());
 * 
 *      this.subs.sink = merge(
 *          documentType.items.pipe(isReady()),
 *          direction.items.pipe(isReady()),
 *      ).subscribe()
 * 
 *      // vs
 * 
 *      merge(
 *          this.dictionaryService.getDocumentTypeSelectItems().pipe(tap(_ => this.documentTypeSelectItems = _)),
 *          this.dictionaryService.getDirectionSelectItems().pipe(tap(_ => this.directionSelectItem = _)),
 *      ).subscribe(() => { this.cdh.dataLoading = false; })
 *      
 *      this.actionButtons.save.onClick = () => this.save();
 *      this.actionButtons.forceSave.onClick = () => this.save(SaveMode.FORCE);
 * 
 *      // makes sense only in EDIT mode
 *      this.subs.sink = this.form.stateChanges.subscribe(() => this.actionButtons.save.visible = !this.form.invalid());
 * 
 *      // possibility of using proxy | foreign to non-Vue coders :/
 *      // this.subs.sink = this.onlyRegister.valueChanges.subscribe(() => this.)
 *  }
 * 
 *  private save(saveMode: SaveMode = SaveMode.NORMAL): void {
 *      if (!this.canDocumentBeSaved()) return;
 * 
 *      const document: DocumentDataApi = this.getDocumentFromForm(); // this is bussiness logic, not view logic
 *      this.apiService(document, saveMode)
 *          .subscribe((result) => this.handleDocumentSendingResponse(result));
 *  }
 * 
 *  private canDocumentBeSaved(): boolean {
 *      this.form.triggerValidation();
 *      return !this.form.invalid;
 *  }
 * 
 *  // handlers
 * 
 *  // this is messing with: handle<UIevent>() pattern
 *  private handleDocumentSendingResponse(result: DBResponse) {
 *      if (isPositive) {
 *          this.closeView();
 *      } else {
 *          this.displayValidationResult(result);
 *          this.present
 *      }
 *  }
 * 
 *  private handleOnlyRequestChanged(onlyRequest: boolean) {
 *      if (this.onlyRequest) {
 *          this.setValidators({
 *              objectId: Validators.required,
 *          });
 *      } else {
 *          this.setValidators({
 *              objectId: Validators.required,
 *              someValue: Validators.required,
 *          })
 *      }
 *  }
 * 
 * // util methods
 * private displayValidationResult(result): void {
 *      this.validationResult = result;
 * }
 * 
 */


 /* 
 *  // sometimes i want to see what makes sth change
 *  // like: 
 *  // get loaderVisible(): boolean {
 *  //      this.
 *  //      this.dataIsBeingSent;
 *  // }
 *  // guess that's a drawback and a benefit of model binding - no handler in class
 * 
 *  // sometimes i want to see what a change does to other things
 */  // can I have both

// ----------------------


// 2 ways?:

// const useXYZComponent = defineDynamicComponent({
//      class: XYZComponentClassRef,
//      inputs: ['fieldName1', 'fafield'],
//      extends: (comp, state) => ({}),
// });

// useComponent(ComponentClassRef, inputs)

class Componen2 {
    formElements = {
        direction: useAppDirectionSelect(),
        documentId: useAppInput({ label: 'Id dokumentu' }),
        objectId: useAppInput({ label: 'Id obiektu' }),
    };


    form = this.dynamic.getFormGroup(this.formElements);

    formInit = this.dynamic.getInitFunction(this.formElements);

    ngOnInit(): void {
        this.subs.sink = this.formInit().subscribe();
    }
}
