import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from './store';

export { persistor, useAppDispatch, store } from './store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

