import * as React from '../../@types/react@17.0.34/index.d.ts';

export default function createReactContext<T>(
  defaultValue: T,
  calculateChangedBits?: (prev: T, next: T) => number
): Context<T>;

type RenderFn<T> = (value: T) => React.ReactNode;

export type Context<T> = {
  Provider: React.ComponentClass<ProviderProps<T>>;
  Consumer: React.ComponentClass<ConsumerProps<T>>;
};

export type ProviderProps<T> = {
  value: T;
  children: React.ReactNode;
};

export type ConsumerProps<T> = {
  children: RenderFn<T> | [RenderFn<T>];
  observedBits?: number;
};
