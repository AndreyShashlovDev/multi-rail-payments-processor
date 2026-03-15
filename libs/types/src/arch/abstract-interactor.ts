export abstract class AbstractInteractor<P, R> {
  abstract execute(params: P): R
}
