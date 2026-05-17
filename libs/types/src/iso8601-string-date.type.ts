const DATE_ISO8601_BRAND = Symbol('DATE_ISO8601_BRAND')

export type Iso8601StringDate = string & { readonly [DATE_ISO8601_BRAND]: true }

export const Iso8601StringDate = {
  create(date: Date): Iso8601StringDate {
    return date.toISOString() as Iso8601StringDate
  },
}
