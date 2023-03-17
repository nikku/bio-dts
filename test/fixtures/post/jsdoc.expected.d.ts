export type EventListener = {
  callback: Function;
  next: EventListener|null;
  number: priority;
};