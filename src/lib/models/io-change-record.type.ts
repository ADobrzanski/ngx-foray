import { KeyValueChangeRecord } from "@angular/core";
import { IOPropertyKey } from "./io-property-key.type";

export type IOChangeRecord<T = unknown> = KeyValueChangeRecord<IOPropertyKey, T>;