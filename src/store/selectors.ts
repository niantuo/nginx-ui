import { RootState } from './store';

// 用户相关的
export const loginSelector = (state: RootState) => state.user.isLogin;
export const userInfoSelector = (state: RootState) => state.user.user;
// app
export const isMobileSelector = (state: RootState) => state.app.responsive?.isMobile;
export const appSelector = (state: RootState) => state.app;
// designer
