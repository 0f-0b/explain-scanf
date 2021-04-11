import type { NavigateOptions, WindowLocation } from "@reach/router";
import { navigate as doNavigate } from "@reach/router";

export function navigate<S>(to: string, { state, replace }: NavigateOptions<S> = {}): Promise<void> {
  return doNavigate(to, { state: { value: state }, replace });
}

export function locationState<S>(location: WindowLocation | undefined): S | undefined {
  return (location as WindowLocation<{ value?: S; key: string; }>).state?.value;
}
