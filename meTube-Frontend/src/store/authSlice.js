import { createReducer, createSlice } from "@reduxjs/toolkit";


const INITIAL_STATE = {
    status: false,
    data: null
}

const authSlice = createSlice({
    name: "Auth_Slice",
    initialState: INITIAL_STATE,
    reducers: {
        login: (state, action) => {
            state.status = true;
            state.data = action.payload.data // same name as the APIresponse provides.
        },
        logouot: (state, action) => {
            state.status = false;
            state.data = null
        }
    }
})

export const { login, logouot } = authSlice.actions;

export const authReducer = authSlice.reducer;

export const authSelector = (state) => state.authReducer;

