import { combineReducers } from '@reduxjs/toolkit';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import userReducer from './slice/user.ts';
import nginxReducer from './slice/nginx.ts'

export type IAppState = {
  responsive: {
    isMobile: boolean;
  };
  asideHidden: boolean;
};

const initialState: IAppState = {
  responsive: {
    isMobile: false,
  },
  asideHidden: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setResponsive(state, action: PayloadAction<{ isMobile: boolean }>) {
      state.responsive = action.payload;
    },
    setAsideHidden(state, action: PayloadAction<boolean>) {
      state.asideHidden = action.payload;
    },
  },
});
export const { setResponsive, setAsideHidden } = appSlice.actions;

const rootReducer = combineReducers({
  app: appSlice.reducer,
  user: userReducer,
  nginx: nginxReducer,
});

export default rootReducer;
