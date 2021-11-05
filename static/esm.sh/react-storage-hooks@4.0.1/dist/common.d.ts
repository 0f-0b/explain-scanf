export declare type StorageObj = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export declare function useInitialState<S>(storage: StorageObj, key: string, defaultState: S): S;
export declare function useStorageWriter<S>(storage: StorageObj, key: string, state: S): Error | undefined;
export declare function useStorageListener<S>(storage: StorageObj, key: string, defaultState: S, onChange: (newValue: S) => void): void;
