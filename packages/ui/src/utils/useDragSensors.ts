import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { DRAG_ACTIVATION_DISTANCE_PX } from "./gesture";

/** How long a finger must rest before a drag arms, in ms. */
const TOUCH_HOLD_MS = 200;

/** How far a finger may stray during the hold without cancelling it, in px. */
const TOUCH_HOLD_TOLERANCE_PX = 10;

/**
 * The house dnd-kit activation split, for every draggable surface.
 *
 * A single `PointerSensor` cannot serve both input types. Mouse arms on
 * **distance**, because dnd-kit's `delay` constraint cancels activation outright
 * when the pointer travels past `tolerance` before the timer fires — so a fast,
 * decisive drag never picks the item up at all. Touch keeps a **hold**, because
 * distance-based activation there competes with the scroll the finger is also
 * describing, and the browser wins: the pointer is cancelled and the drag dies.
 *
 * Keyboard is included so a drag is reachable without a pointer.
 */
export function useDragSensors(): SensorDescriptor<SensorOptions>[] {
  return useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_HOLD_MS,
        tolerance: TOUCH_HOLD_TOLERANCE_PX,
      },
    }),
    useSensor(KeyboardSensor),
  );
}
