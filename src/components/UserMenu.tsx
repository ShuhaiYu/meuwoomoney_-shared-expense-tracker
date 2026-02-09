"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (isPending || !session?.user) return null;

  const { name, email, image } = session.user;
  const initial = (name ?? email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-cat-orange text-white font-bold text-lg flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-cat-orange/50 transition focus:outline-none focus:ring-2 focus:ring-cat-orange/50"
      >
        {image ? (
          <Image src={image} alt={name ?? "Avatar"} width={40} height={40} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <div className="px-4 py-2">
            <p className="font-bold text-cat-dark text-sm truncate">{name ?? "User"}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
          <hr className="border-gray-100 my-1" />
          <button
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/auth/sign-in";
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cat-brown hover:bg-cat-cream transition"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
