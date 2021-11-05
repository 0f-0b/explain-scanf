import { Reducer, Dispatch } from '../../@types/react@17.0.34/index.d.ts';
import { StorageObj } from './common.d.ts';
declare function useStorageReducer<S, A>(storage: StorageObj, key: string, reducer: Reducer<S, A>, defaultState: S): [S, Dispatch<A>, Error | undefined];
declare function useStorageReducer<S, A, I>(storage: StorageObj, key: string, reducer: Reducer<S, A>, defaultInitialArg: I, defaultInit: (defaultInitialArg: I) => S): [S, Dispatch<A>, Error | undefined];
export default useStorageReducer;
