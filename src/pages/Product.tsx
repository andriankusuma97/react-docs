import { useState, type FormEvent, type ChangeEvent } from "react";


function Product(){
  const [input, setInput] = useState<string>("");
  const [items, setItems] = useState<string[]>(["ayam", "nasi", "asdas"]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    setItems((prevItems) => [...prevItems, input]);
    setInput("");

    console.log(items, "<<<< masuk sini");
  };


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e);
    
    setInput(e.target.value);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex  justify-center w-full ">
        <label className="  p-10">
          <input
            className="border-none p-4 rounded-xl outline-none bg-gray-200 w-98 text-sky-800"
            placeholder="Please insert your input"
            type="text"
            value={input}
            onChange={handleChange}
          />
        </label>
      </form>

      <div className=" w-full min-h-screen rounded-2xl mb-4 p-8 flex flex-col items-center">
        {items.map((e, index) => (
          <div className="bg-white mb-4 rounded-md w-52 p-2 text-sky-800" key={index}>{e}</div>
        ))}
      </div>
    </>
  );
}

export default Product