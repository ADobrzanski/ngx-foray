export type PublicProperties<T extends {}> = Pick<T, PublicPropertyKeys<T>>;

export type PublicPropertyKeys<T extends {}, K = keyof T> = K extends keyof T
  ? T[K] extends Function
    ? never
    : K
  : never;
