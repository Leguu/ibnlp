import { Position, Toaster } from "@blueprintjs/core";

export const AppToaster = (typeof window !== 'undefined')
  ? Toaster.create({
    className: "recipe-toaster",
    position: Position.TOP,
  })
  : null;