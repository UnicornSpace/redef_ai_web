"use client";

import { Plus, Trash2, Wallet } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createTransaction, deleteTransaction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type { Transaction, TransactionType } from "@/lib/types/productivity";
import { cn } from "@/lib/utils";

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(dateStr: string, today: Date): string {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === dateKey(today)) return "Today";
  if (dateStr === dateKey(yesterday)) return "Yesterday";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const PRESET_CATEGORIES = [
  "Groceries",
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Salary",
  "Other",
];

const ALL_SPACES = "__all__";
import {
  Card,
  CardDescription,
  CardFrame,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
export function FinanceClient({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState(() => dateKey(new Date()));
  const [category, setCategory] = useState("");
  const [space, setSpace] = useState("");
  const [description, setDescription] = useState("");
  const [spaceFilter, setSpaceFilter] = useState(ALL_SPACES);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const yesterdayKey = useMemo(() => {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return dateKey(y);
  }, [today]);

  const categorySuggestions = useMemo(() => {
    const set = new Set(PRESET_CATEGORIES);
    for (const t of transactions) if (t.category) set.add(t.category);
    return Array.from(set);
  }, [transactions]);

  const spaces = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) if (t.space) set.add(t.space);
    return Array.from(set).sort();
  }, [transactions]);

  const monthPrefix = todayKey.slice(0, 7);
  const monthlyIncome = transactions
    .filter((t) => t.type === "income" && t.occurred_on.startsWith(monthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = transactions
    .filter(
      (t) => t.type === "expense" && t.occurred_on.startsWith(monthPrefix),
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const filtered = useMemo(() => {
    if (spaceFilter === ALL_SPACES) return transactions;
    return transactions.filter((t) => t.space === spaceFilter);
  }, [transactions, spaceFilter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = groups.get(t.occurred_on) ?? [];
      list.push(t);
      groups.set(t.occurred_on, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [filtered]);

  function resetForm() {
    setAmount("");
    setCategory("");
    setSpace("");
    setDescription("");
    setOccurredOn(todayKey);
  }

  function handleAdd() {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }

    const optimistic: Transaction = {
      id: uid(),
      user_id: null,
      type,
      amount: parsedAmount,
      category: category.trim() || null,
      space: space.trim() || null,
      description: description.trim() || null,
      occurred_on: occurredOn,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTransactions((prev) => [optimistic, ...prev]);
    setOpen(false);
    resetForm();

    startTransition(async () => {
      const res = await createTransaction({
        type: optimistic.type,
        amount: optimistic.amount,
        category: optimistic.category,
        space: optimistic.space,
        description: optimistic.description,
        occurredOn: optimistic.occurred_on,
      });
      if (res.error) {
        setTransactions((prev) => prev.filter((t) => t.id !== optimistic.id));
        toast.error(res.error);
      }
    });
  }

  function handleDelete(transaction: Transaction) {
    setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    startTransition(async () => {
      const res = await deleteTransaction(transaction.id);
      if (res.error) {
        setTransactions((prev) => [...prev, transaction]);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-16 md:px-8 mt-6">
      <div className="flex gap-3">
        <CardFrame className="w-full max-w-44">
          <CardFrameHeader className="py-1">
            <CardFrameTitle>Income</CardFrameTitle>
            {/* <CardFrameDescription>
                              Deploy your new project in one-click.
                            </CardFrameDescription> */}
          </CardFrameHeader>
          <Card>
            <CardPanel className="py-4 mx-auto">
              <p className="text-2xl font-bold">{formatMoney(monthlyIncome)}</p>
            </CardPanel>
          </Card>
        </CardFrame>
        <CardFrame className="w-full max-w-44">
          <CardFrameHeader className="py-1 mx-auto">
            <CardFrameTitle>Spent</CardFrameTitle>
            {/* <CardFrameDescription>
                              Deploy your new project in one-click.
                            </CardFrameDescription> */}
          </CardFrameHeader>
          <Card>
            <CardPanel className="py-4 mx-auto">
              <p className="text-2xl font-bold">
                {formatMoney(monthlyExpense)}
              </p>
            </CardPanel>
          </Card>
        </CardFrame>
        <CardFrame className="w-full max-w-44">
          <CardFrameHeader className="py-1 mx-auto">
            <CardFrameTitle>Net (this month)</CardFrameTitle>
            {/* <CardFrameDescription>
                              Deploy your new project in one-click.
                            </CardFrameDescription> */}
          </CardFrameHeader>
          <Card>
            <CardPanel className="py-4 mx-auto">
              <p className="text-2xl font-bold">
                {formatMoney(monthlyIncome - monthlyExpense)}
              </p>
            </CardPanel>
          </Card>
        </CardFrame>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {/* <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-body-muted">
            Income
          </p>
          <p className="tabular-nums text-lg font-extrabold text-rf-green-deep sm:text-xl">
            {formatMoney(monthlyIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-body-muted">
            Expense
          </p>
          <p className="tabular-nums text-lg font-extrabold text-rf-coral sm:text-xl">
            {formatMoney(monthlyExpense)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-body-muted">
            Net (this month)
          </p>
          <p className="tabular-nums text-lg font-extrabold text-ink sm:text-xl">
            {formatMoney(monthlyIncome - monthlyExpense)}
          </p>
        </div> */}
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus />
            Add transaction
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a transaction</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 px-6">
              <Tabs
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
              >
                <TabsList>
                  <TabsTab value="expense">Expense</TabsTab>
                  <TabsTab value="income">Income</TabsTab>
                </TabsList>
              </Tabs>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
              />
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant={occurredOn === todayKey ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setOccurredOn(todayKey)}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant={
                    occurredOn === yesterdayKey ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() => setOccurredOn(yesterdayKey)}
                >
                  Yesterday
                </Button>
                <Input
                  type="date"
                  nativeInput
                  value={occurredOn}
                  onChange={(e) => setOccurredOn(e.target.value)}
                  className="w-36"
                />
              </div>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                list="finance-categories"
              />
              <datalist id="finance-categories">
                {categorySuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <Input
                value={space}
                onChange={(e) => setSpace(e.target.value)}
                placeholder="Space (optional, e.g. Japan trip)"
                list="finance-spaces"
              />
              <datalist id="finance-spaces">
                {spaces.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={!amount.trim()}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {spaces.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSpaceFilter(ALL_SPACES)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-[background-color,border-color,scale] active:scale-[0.96]",
              spaceFilter === ALL_SPACES
                ? "border-rf-green-deep bg-g-green-pale text-rf-green-deep"
                : "border-line bg-white text-body-muted",
            )}
          >
            All
          </button>
          {spaces.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpaceFilter(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-[background-color,border-color,scale] active:scale-[0.96]",
                spaceFilter === s
                  ? "border-rf-green-deep bg-g-green-pale text-rf-green-deep"
                  : "border-line bg-white text-body-muted",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>No transactions yet</EmptyTitle>
            <EmptyDescription>
              Add your first expense or income above to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([date, items]) => {
            const net = items.reduce(
              (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
              0,
            );
            return (
              <div key={date} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between px-1">
                  <h3 className="text-sm font-semibold text-ink">
                    {dayLabel(date, today)}
                  </h3>
                  <span
                    className={cn(
                      "tabular-nums text-xs font-semibold",
                      net >= 0 ? "text-rf-green-deep" : "text-rf-coral",
                    )}
                  >
                    {net >= 0 ? "+" : "-"}
                    {formatMoney(Math.abs(net))}
                  </span>
                </div>
                <div className="rounded-2xl border border-line bg-paper">
                  {items.map((t, i) => (
                    <div
                      key={t.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5",
                        i !== items.length - 1 && "border-b border-line",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-ink">
                          {t.description || t.category || "Untitled"}
                        </span>
                        <span className="flex flex-wrap gap-1.5 text-xs text-body-muted">
                          {t.category ? <span>{t.category}</span> : null}
                          {t.space ? (
                            <span className="rounded-full bg-line px-1.5 py-0.5">
                              {t.space}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "tabular-nums shrink-0 text-sm font-semibold",
                          t.type === "income"
                            ? "text-rf-green-deep"
                            : "text-rf-coral",
                        )}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatMoney(t.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(t)}
                        aria-label="Delete transaction"
                        className="shrink-0 text-body-muted"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
