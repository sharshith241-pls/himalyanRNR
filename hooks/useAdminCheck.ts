"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (!supabase) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if user is admin (you can add a role field in user_profiles)
        const { data } = await supabase
          .from("user_profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();

        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  return { isAdmin, loading };
};
