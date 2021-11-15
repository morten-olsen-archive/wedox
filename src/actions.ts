import { AnyAction } from "redux";

export const remote = (action: AnyAction) => ({
  type: '@@REMOTE/DISPATCH',
  payload: action,
})
