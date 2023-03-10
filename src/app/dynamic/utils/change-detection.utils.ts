import { SimpleChange, SimpleChanges } from "@angular/core";
import {
  startWith,
  pairwise,
  map,
  OperatorFunction,
} from "rxjs";

const getAllKeys = (...objects: {}[]): string[] => {
  const keys: any = objects.reduce(
    (acc: string[], _) => [...acc, ...Object.keys(_)],
    [] as string[]
  );
  return Array.from(new Set(keys));
};

class SimpleChangesTracker {
  private changedKeysSet = new Set<string>();

  // @todo previousValue is not persisted and can be wrong
  //       implementation is not precise
  makeSimpleChanges = <T extends {}>(
    previous: T | null,
    current: T | null,
  ): SimpleChanges => {
    const allKeys = getAllKeys(previous || {}, current || {});

    const simpleChanges: SimpleChanges = allKeys
      .reduce((simpleChanges, inputName) => {
        const currentValue = (<any>current)?.[inputName];
        const previousValue = (<any>previous)?.[inputName];
        const inputHasChanged = currentValue !== previousValue;

        if (!inputHasChanged) return simpleChanges;

        const firstChange = this.changedKeysSet.has(inputName);
        this.changedKeysSet.add(inputName);
        const singleSimpleChange = new SimpleChange(previousValue,currentValue, firstChange);
        
        simpleChanges[inputName] = singleSimpleChange;
        return simpleChanges;

      }, {} as SimpleChanges);
    
    return simpleChanges;
  };
}

export const intoSimpleChanges: OperatorFunction<
  Record<string, unknown> | null,
  SimpleChanges
> = (src$) => {
  const simpleChangesTracker = new SimpleChangesTracker();
  
  return src$.pipe(
    startWith(null),
    pairwise(),
    map(([prev, curr]) => {
      const simpleChanges = simpleChangesTracker.makeSimpleChanges(prev, curr);
      return simpleChanges;
    })
  );
}
