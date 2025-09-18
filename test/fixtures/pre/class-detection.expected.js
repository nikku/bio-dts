export class AClass {
  constructor() {

    if (1 != 2) {
      return;
    }
  }
}

export function NotAClass() {
  return 15;
}

/**
 * @function
 */
export function AlsoNotAClass() {

  if (1 != 2) {
    return 15;
  } else {
    return 20;
  }
}