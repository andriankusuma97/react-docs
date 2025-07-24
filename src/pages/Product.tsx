import { useState, type FormEvent, type ChangeEvent } from "react";
import { useStore } from "../store/store";


function Product(){
  const [input, setInput] = useState<string>("");
  // const [items, setItems] = useState<string[]>(["ayam", "nasi", "asdas"]);
  const {count , increment, product,addProduct  } = useStore()
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    // setItems((prevItems) => [...prevItems, input]);
     addProduct(input)
    setInput("");
  };


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e);
    
    setInput(e.target.value);
  };

  return (
    <>
      <div className=" flex fixed top-12 right-12 w-8 h-8 rounded-2xl bg-sky-300 items-center justify-center" onClick={increment} > {count} </div>
      <form onSubmit={handleSubmit} className="flex  justify-center  ">
        <label className="">
          <input
            className="border-none p-4 rounded-xl outline-none bg-gray-200 w-98 text-sky-800"
            placeholder="Please insert your input"
            type="text"
            value={input}
            onChange={handleChange}
          />
        </label>
      </form>

      <div className="min-h-screen rounded-2xl mb-4 p-8 flex flex-col items-center">
        {product.map((e, index) => (
          <div className="bg-white mb-4 rounded-md w-52 p-2 text-sky-800" key={index}>{e}</div>
        ))}
      </div>
    </>
  );
}

export default Product