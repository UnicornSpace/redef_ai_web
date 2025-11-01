import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { TbArrowUpRight } from "react-icons/tb";

const Navbar = () => {
  return (
    <header className="w-full max-w-2xl mx-auto rounded-4xl mt-6 border-b border-[#37322f]/6 bg-[#f7f5f3]/60">
      <div className="max-w-[1060px] mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <div className="text-[#37322f] font-semibold text-lg">
              Brillance
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium">
                Products
              </button>
              <button className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium">
                Pricing
              </button>
              <button className="text-[#37322f] hover:text-[#37322f]/80 text-sm font-medium">
                Docs
              </button>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-[#37322f] hover:bg-[#37322f]/5"
          >
            Log in
          </Button>
        </nav>
      </div>
    </header>   
  );
  return (
    <header className="py-4 rounded-full flex items-center justify-between max-w-2xl mx-auto px-4">
      <Link href={"/"} className="font-serif font-medium text-2xl">
        <span className="bg-primary px-[2px] rounded-sm">
          <span className="text-white">*R</span>
        </span>
        edef AI
      </Link>
      <section>
        <Link href="/waitlist">
          <Button className="text-xl text-black" variant={"link"}>
            Join
          </Button>
        </Link>
      </section>
    </header>
  );
};

export default Navbar;
