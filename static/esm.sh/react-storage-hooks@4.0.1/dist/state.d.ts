import { Dispatch, SetStateAction } from '../../@types/react@17.0.34/index.d.ts';
import { StorageObj } from './common.d.ts';
declare function useStorageState<S>(storage: StorageObj, key: string, defaultState: S | (() => S)): [S, Dispatch<SetStateAction<S>>, Error | undefined];
declare function useStorageState<S>(storage: StorageObj, key: string): [S | null, Dispatch<SetStateAction<S | null>>, Error | undefined];
export default useStorageState;
