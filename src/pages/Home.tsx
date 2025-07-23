import {  Outlet, useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const navbar = [
    {title: "Product", route:""},
    {title: "Docs", route:"docs"},
    {title: "Scan", route:"cart"},
  ]

  const handleNavigate = (value : string) => {
    
    navigate('/' + value)
  }
  return(
    <div className="min-h-screen ">
      <div className="fixed sm:top-44 sm:left-6 sm:flex sm:flex-col sm:gap-4 sm:w-auto 
                    top-0 m-auto  w-full flex flex-row gap-2 justify-center overflow-auto p-2 z-50">
        {
          navbar.map(el =>{
            return(
               <button
                onClick={() => handleNavigate(el.route)}
                className="text-white border-none bg-[#1b1b1b] rounded-full h-26 w-26 shadow-xl/80 shadow-slate-600/50 hover:shadow-xl/80 hover:shadow-indigo-500/50 hover:bg-indigo-900"
                >
                  {el.title}
                </button>
            )
          })
        }
          
       
       
        </div>
      <div className="sm:mt-12 mt-38">
        <Outlet/>
      </div>
    </div>
  )
}

export default Home;
