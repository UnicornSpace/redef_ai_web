import React from "react";

const page = () => {
  return (
    <div className="flex ">
      <section className="flex flex-col h-screen  transition-all duration-500 lg:w-[375px] lg:shrink-0 lg:border-r lg:border-neutral-300">
        <h2 className="font-condensed text-h-m text-primary-700 mb-6 px-6 text-[#0d3c26] text-2xl  mt-16 font-serif ">
          Good Afternoon, Faizan?
        </h2>
        <div className="grid grid-cols-2 px-6 gap-4">
          <div className="border rounded-xl col-span-1 size-40 bg-amber-100/50"></div>
          <div className="border rounded-xl col-span-1 size-40 bg-amber-100/50" ></div>
          <div className="border rounded-xl col-span-2 h-40 bg-amber-100/50" ></div>
          <div className="border rounded-xl col-span-2 row-span-2 h-80 bg-amber-100/50" ></div>
        </div>
      </section>
      <section></section>
    </div>
  );
};

export default page;
