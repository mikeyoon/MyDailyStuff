export interface Observable<T> {
  subscribe(onSuccess: (value: T) => void): () => void;
}

export class Subject<T> {
  private subscriptions: Set<(value: T) => void>;

  constructor() {
    this.subscriptions = new Set();
  }

  next(value: T) {
    this.subscriptions.forEach((notify) => {
      try {
        notify(value);
      } catch {
        // If we had an onError callback, this is where it'd be useful
      }
    });
  }

  subscribe(onSuccess: (value: T) => void): () => void {
    this.subscriptions.add(onSuccess);
    return () => this.subscriptions.delete(onSuccess);
  }
}

export class BehaviorSubject<T> {
  private value: T;
  private subject: Subject<T>;
  
  constructor(initial: T) {
    this.value = initial;
    this.subject = new Subject<T>();
    this.subject.next(initial);
  }

  next(value: T) {
    this.value = value;
    this.subject.next(value);
  }

  subscribe(onSuccess: (value: T) => void): () => void {
    const unsubscribe = this.subject.subscribe(onSuccess);
    onSuccess(this.value);
    return () => unsubscribe();
  }
}