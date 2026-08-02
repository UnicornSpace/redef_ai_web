"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";
import type { Transaction, TransactionType } from "@/lib/types/productivity";

export async function listTransactions(): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("is_deleted", false)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTransaction(input: {
  type: TransactionType;
  amount: number;
  category?: string | null;
  space?: string | null;
  description?: string | null;
  occurredOn: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "Enter an amount greater than 0" };
  }

  const { error } = await supabase.from("transactions").insert({
    id: crypto.randomUUID(),
    type: input.type,
    amount: input.amount,
    category: input.category?.trim() || null,
    space: input.space?.trim() || null,
    description: input.description?.trim() || null,
    occurred_on: input.occurredOn,
    user_id: user.user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/personal-finance");
  return {};
}

export async function deleteTransaction(
  transactionId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("transactions")
    .update({ is_deleted: true })
    .eq("id", transactionId)
    .eq("user_id", user.user.id);
  if (error) return { error: error.message };

  revalidatePath("/app/personal-finance");
  return {};
}
