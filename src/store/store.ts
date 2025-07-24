import { create } from "zustand";

interface Count {
  count: number;
}

interface Store {
  count: number;
  increment: ()=>void,
  product:string[],
  addProduct: (data: string) => void;
}

export const useStore = create<Store>((set)=>({
    count:0,
    increment: () => set((state: Count) => ({ count: state.count + 1 })),
    product:["ayam", "nasi", "asdas"],
    addProduct:(data: string)=> set((state)=>({product:[...state.product,data]}))
}));