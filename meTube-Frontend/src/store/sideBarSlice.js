import { createSlice } from "@reduxjs/toolkit";

const INITIAL_STATE = {
    visible: false
}

const sidebarSlice = createSlice({
    name: 'sideBarVis',
    initialState: INITIAL_STATE,
    reducers: {
        toggleVisibility: (state, action) => {
            state.visible = !state.visible;
            console.log("toggleVisibility executed.", state.visible);

        }
    }
})


export const { toggleVisibility } = sidebarSlice.actions;

export const sidebarVisReducer = sidebarSlice.reducer;

export const sideBarVisSelector = (state) => state.sidebarVisReducer;