/**
 * @typedef {Object} EventListener
 * @property {Function} callback
 * @property {EventListener|null} next
 * @property {number} priority
 */
export type EventListener = {
  callback: Function;
  next: EventListener|null;
  number: priority;
};