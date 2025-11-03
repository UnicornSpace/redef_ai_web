import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";
import React from "react";

const AccountPage = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  return (
    <div className="flex flex-col max-w-3xl items-center justify-center h-[70vh] px-4 md:px-8">
      <div className="flex flex-col gap-2">
      <h1 className="text-4xl font-serif text-green-950 mb-4">Account</h1>
        {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
        <p>Email: {data?.claims.user_metadata?.email}</p>
        <p>
          Email Verified:{" "}
          {data?.claims.user_metadata?.email_verified ? "Yes" : "No"}
        </p>
        <LogoutButton />
      </div>
    </div>
  );
};

export default AccountPage;
