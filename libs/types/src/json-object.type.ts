export type JsonObject<T> = {
  readonly [K in keyof T]: T[K] extends object ? JsonObject<T[K]> : T[K]
}
