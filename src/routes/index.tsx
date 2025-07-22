import Home from "../pages/Home";
import Product from "../pages/Product";
import Documentation from "../pages/Documentation";
import type { RouteObject } from "react-router-dom";
import Cart from "../pages/Cart";


const AppRoutes : RouteObject[] = [
    {
        path:"/",
        element:<Home/>,
        children:[
            {index:true,element:<Product/>},
            {path:"docs",element:<Documentation/>},
            {path:"cart",element:<Cart/>}
        ]
    }
]

export default AppRoutes;

