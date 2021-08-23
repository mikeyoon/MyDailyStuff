import { Observable, Subject } from "../util/observable.js";

type KeyOf<T extends object> = Extract<keyof T, string>; // Only gets string keys
type FunctionPropertyNames<T> = { 
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export abstract class BaseStore<T, U = KeyOf<Omit<T, 'propChanged$' | FunctionPropertyNames<T>>>> {
  private propNotifier: Subject<U>;
  public propChanged$: Observable<U>;

  constructor() {
    this.propNotifier = new Subject();
    this.propChanged$ = this.propNotifier;
  }

  protected notifyPropertyChanged(...props: U[]) {
    props.forEach((prop) => this.propNotifier.next(prop));
  }
}