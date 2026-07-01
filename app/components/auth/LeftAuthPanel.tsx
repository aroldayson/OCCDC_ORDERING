"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function LeftAuthPanel() {
  const [ordersCount, setOrdersCount] = useState<number | string>("...");
  const [suppliersCount, setSuppliersCount] = useState<number | string>("...");
  const [schoolsCount, setSchoolsCount] = useState<number | string>("...");

  useEffect(() => {
    async function fetchCounts() {
      try {
        // Fetch orders count
        const { count: orders } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });
        
        if (orders !== null) setOrdersCount(orders);

        // Fetch suppliers count (admin role)
        const { count: suppliers } = await supabase
          .from("user_profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        
        if (suppliers !== null) setSuppliersCount(suppliers);

        // Fetch schools count
        const { count: schools } = await supabase
          .from("schools")
          .select("*", { count: "exact", head: true });
        
        if (schools !== null) setSchoolsCount(schools);

      } catch (error) {
        console.error("Error fetching stats:", error);
        // Fallback to defaults or keep as is if there's an error
      }
    }

    fetchCounts();
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-[#0c1e45] via-[#0f2c6e] to-[#0a1532] animate-gradient-xy p-12 text-white flex flex-col justify-between hidden lg:flex">
      <div>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <span className="text-2xl text-blue-600">🛒</span>
          </div>

          <div>
            <p className="uppercase tracking-widest text-blue-100 text-xs font-bold">
              OCCDC
            </p>
            <h1 className="text-2xl font-bold">
              Ordering System
            </h1>
          </div>
        </div>

        <div className="mt-12 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-blue-100 border border-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Efficient • Reliable • Organized
        </div>

        <h2 className="mt-8 text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
          Streamlined <span className="text-blue-200">Ordering.</span>
          <br />
          Better Service.
        </h2>

        <p className="mt-6 max-w-md text-lg text-blue-100/90 leading-relaxed">
          Manage orders, track requests, and streamline
          procurement processes in one centralized system.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/10 p-5 border border-white/10 hover:bg-white/15 transition">
            <div className="h-10 w-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-xl mb-4">
              🏫
            </div>
            <p className="text-blue-100 text-sm font-medium">Schools</p>
            <h3 className="text-2xl font-bold mt-1">{schoolsCount}</h3>
            <p className="text-blue-200/70 text-xs mt-1">Partner Schools</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 border border-white/10 hover:bg-white/15 transition">
            <div className="h-10 w-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-xl mb-4">
              📋
            </div>
            <p className="text-blue-100 text-sm font-medium">Orders</p>
            <h3 className="text-2xl font-bold mt-1">{ordersCount}</h3>
            <p className="text-blue-200/70 text-xs mt-1">Total Orders</p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 border border-white/10 hover:bg-white/15 transition">
            <div className="h-10 w-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-xl mb-4">
              👥
            </div>
            <p className="text-blue-100 text-sm font-medium">Suppliers</p>
            <h3 className="text-2xl font-bold mt-1">{suppliersCount}</h3>
            <p className="text-blue-200/70 text-xs mt-1">Active Suppliers</p>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-white/5 border border-white/10 p-6 flex items-center justify-between">
        <div>
          <p className="uppercase tracking-widest text-blue-200/80 text-xs font-bold">
            ORDERING PORTAL
          </p>
          <p className="mt-1 text-white text-sm font-medium">
            Smart ordering for efficient operations
          </p>
        </div>
        <div className="text-4xl opacity-30">
          🛒
        </div>
      </div>
    </div>
  );
}
