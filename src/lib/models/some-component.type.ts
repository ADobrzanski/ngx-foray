import { OnChanges, OnDestroy } from "@angular/core";
import { IOPropertyKey } from './io-property-key.type';

export type SomeComponent = Record<IOPropertyKey, unknown> & Partial<OnDestroy & OnChanges>;