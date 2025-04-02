import { configureStore } from '@reduxjs/toolkit';
import { sidebarVisReducer } from './sideBarSlice.js';
import { authReducer } from './authSlice.js';

const store = configureStore({
    reducer: { sidebarVisReducer, authReducer }
});


export default store;