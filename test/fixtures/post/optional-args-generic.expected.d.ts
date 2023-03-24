declare class EventBus {
  on<T extends any>(event: string, callback: (t: T) => any, context?: any): void;
  on<T extends any>(event: string, priority: number, callback: (t: T) => any, context?: any): void;
}

declare function on<T extends any>(event: string, callback: (t: T) => any, context?: any): void
declare function on<T extends any>(event: string, priority: number, callback: (t: T) => any, context?: any): void
