// import { useEffect, useState } from "react"
import { Transition } from "@headlessui/react";
import { Link, useLocation } from "@remix-run/react";
import clsx from "clsx";
import { useState } from "react";
import ShowMoreButton from "./ShowMoreButton";

// import ShowMoreButton from "./ShowMoreButton"

const links = [
  {
    name: "Blog",
    href: "/blog",
  },
  {
    name: "Projects",
    href: "/projects",
  },
  {
    name: "About Me",
    href: "/about",
  },
];

const MenuBar = () => {
  const location = useLocation();

  const [showMobileDropdown, setShowMobileDropdown] = useState(false);

  return (
    <div className="pb-4">
      <div className="mx-4 mt-12 font-semibold md:mx-12">
        <div className="flex items-center justify-between md:justify-start md:gap-x-24">
          <Link
            className="group/link cursor-pointer text-xl md:text-2xl"
            onClick={() => setShowMobileDropdown(false)}
            to={"/"}
          >
            joebrundage.com
            <div className="h-[2px] w-full max-w-0 rounded-xl bg-black transition-all duration-300 group-hover/link:max-w-full" />
          </Link>
          <div className="flex md:hidden">
            <ShowMoreButton
              isActive={showMobileDropdown}
              onClick={() => setShowMobileDropdown((state) => !state)}
            />
          </div>
          <div className="hidden gap-x-8 text-lg text-gray-600 md:flex">
            {links.map((link) => {
              const isActive = location.pathname.includes(link.href);
              return (
                <Link
                  to={link.href}
                  key={`menu-bar-${link.name}`}
                  className={clsx("group/link cursor-pointer", {
                    "hover:text-black": !isActive,
                    "text-black": isActive,
                  })}
                >
                  {link.name}
                  <div
                    className={clsx(
                      "h-[2px] w-full rounded-xl bg-black transition-all duration-300",
                      {
                        "max-w-0 group-hover/link:max-w-full": !isActive,
                        "max-w-full": isActive,
                      }
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <Transition
        show={showMobileDropdown}
        enter="transition-all duration-500"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100"
        leave="transition-all duration-500"
        leaveFrom="opacity-100"
        leaveTo="opacity-0 -translate-y-2"
        className="absolute mt-4 w-full bg-white md:hidden z-50"
      >
        {links.map((link) => (
          <Link
            to={link.href}
            className="flex border-collapse cursor-pointer border-y py-4 pl-4 text-sm font-medium"
            key={`mobile-menu-bar-${link.name}`}
          >
            {link.name}
          </Link>
        ))}
      </Transition>
    </div>
  );
};

export default MenuBar;
