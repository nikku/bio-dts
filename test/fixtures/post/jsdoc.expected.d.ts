export type EventListener = {
  callback: Function;
  next: EventListener|null;
  priority: number;
};