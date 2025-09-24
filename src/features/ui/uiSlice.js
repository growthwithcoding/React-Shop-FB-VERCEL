import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { addModalOpen: false, lastAdded: null },
  reducers: {
    showAddModal(state, action){
      state.addModalOpen = true
      state.lastAdded = action.payload // {title,image,quantity,price}
    },
    hideAddModal(state){
      state.addModalOpen = false
      state.lastAdded = null
    }
  }
})

export const { showAddModal, hideAddModal } = uiSlice.actions
export default uiSlice.reducer
