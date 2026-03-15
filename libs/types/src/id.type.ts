const ID_BRAND = Symbol('Id')

export type Id = string & { readonly [ID_BRAND]: true }

export const Id = {
  create(value: string | bigint | number): Id {
    const str = String(value)
    if (!str || !/^\d+$/.test(str)) {
      throw new Error('Invalid ID')
    }
    return str as Id
  },

  equals(a: Id, b: Id): boolean {
    return a === b
  },

  toString(id: Id): string {
    return id
  },
}
