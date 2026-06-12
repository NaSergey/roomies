export type SwipeDirection = 'left' | 'right';

export interface SwipeHandler {
  (direction: SwipeDirection): void;
}
