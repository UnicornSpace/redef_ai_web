"use client";

import { Plus, Trash2, Wallet } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/actions/finance";
import { useRegisterFab } from "@/components/app-shell/mobile-fab-context";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type { Transaction, TransactionType } from "@/lib/types/productivity";
import { uid } from "@/lib/uid";
import { cn } from "@/lib/utils";

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

// Summary cards are tight on space, so they drop the cents ($.00) that the
// transaction list keeps, and shrink further once the number gets long
// enough to threaten overflow instead of just letting it clip.
function formatMoneyCompact(amount: number): string {
  return Math.round(amount).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

/**
 * The amount field sizes itself to its contents instead of scrolling
 * inside a fixed box. At 3rem tabular digits the old `w-40` fit about
 * five characters, so anything larger scrolled its leading digits out of
 * sight — you would type 125000 and see "5000".
 *
 * `ch` is exact here because the field is `tabular-nums`: every digit is
 * one `ch` wide. Capped by `max-w-full` so a very long figure narrows to
 * the dialog rather than overflowing it.
 */
function amountFieldWidth(value: string): string {
  const len = Math.max(value.length, 4); // 4 = the "0.00" placeholder
  return `${len + 0.5}ch`;
}

/** Step the figure down so long amounts stay legible within the dialog. */
function amountTextSizeClass(value: string): string {
  if (value.length <= 6) return "text-5xl";
  if (value.length <= 9) return "text-4xl";
  return "text-3xl";
}

function metricTextSizeClass(formatted: string): string {
  if (formatted.length <= 7) return "text-2xl";
  if (formatted.length <= 10) return "text-lg";
  return "text-base";
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

type RangeKey = "month" | "last_month" | "7d" | "all";
type TypeFilter = "all" | "expense" | "income";

const RANGE_LABELS: Record<RangeKey, string> = {
  month: "This month",
  last_month: "Last month",
  "7d": "Last 7 days",
  all: "All time",
};

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All types",
  expense: "Expenses",
  income: "Income",
};

/** First day of the month `offset` months back, as a YYYY-MM prefix. */
function monthPrefixFor(today: Date, offset: number): string {
  const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function inRange(occurredOn: string, range: RangeKey, today: Date): boolean {
  if (range === "all") return true;
  if (range === "month") return occurredOn.startsWith(monthPrefixFor(today, 0));
  if (range === "last_month") {
    return occurredOn.startsWith(monthPrefixFor(today, 1));
  }
  const from = new Date(today);
  from.setDate(from.getDate() - 6);
  return occurredOn >= dateKey(from);
}

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { Frame } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [range, setRange] = useState<RangeKey>("month");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  /**
   * Scope = the filters that define "which money are we talking about"
   * (period + space). The summary cards read from this.
   *
   * The type filter is deliberately NOT part of the scope: it narrows the
   * list you are reading, but zeroing the Income card because you ticked
   * "Expenses" would look broken rather than filtered.
   */
  const scoped = useMemo(
    () =>
      transactions.filter(
        (t) =>
          inRange(t.occurred_on, range, today) &&
          (spaceFilter === ALL_SPACES || t.space === spaceFilter),
      ),
    [transactions, range, today, spaceFilter],
  );

  const rangeIncome = scoped
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const rangeExpense = scoped
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const filtered = useMemo(
    () =>
      typeFilter === "all"
        ? scoped
        : scoped.filter((t) => t.type === typeFilter),
    [scoped, typeFilter],
  );

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

  function handleOpenAdd() {
    setEditingId(null);
    resetForm();
    setOpen(true);
  }

  function handleOpenEdit(transaction: Transaction) {
    setEditingId(transaction.id);
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setOccurredOn(transaction.occurred_on);
    setCategory(transaction.category ?? "");
    setSpace(transaction.space ?? "");
    setDescription(transaction.description ?? "");
    setOpen(true);
  }

  function handleSubmit() {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter an amount greater than 0");
      return;
    }

    const payload = {
      type,
      amount: parsedAmount,
      category: category.trim() || null,
      space: space.trim() || null,
      description: description.trim() || null,
      occurredOn,
    };

    if (editingId) {
      const id = editingId;
      const previous = transactions.find((t) => t.id === id);
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                type: payload.type,
                amount: payload.amount,
                category: payload.category,
                space: payload.space,
                description: payload.description,
                occurred_on: payload.occurredOn,
                updated_at: new Date().toISOString(),
              }
            : t,
        ),
      );
      setOpen(false);
      setEditingId(null);

      startTransition(async () => {
        const res = await updateTransaction(id, payload);
        if (res.error) {
          if (previous) {
            setTransactions((prev) =>
              prev.map((t) => (t.id === id ? previous : t)),
            );
          }
          toast.error(res.error);
        }
      });
      return;
    }

    const optimistic: Transaction = {
      id: uid(),
      user_id: null,
      type: payload.type,
      amount: payload.amount,
      category: payload.category,
      space: payload.space,
      description: payload.description,
      occurred_on: payload.occurredOn,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTransactions((prev) => [optimistic, ...prev]);
    setOpen(false);
    resetForm();

    startTransition(async () => {
      const res = await createTransaction(payload);
      if (res.error) {
        setTransactions((prev) => prev.filter((t) => t.id !== optimistic.id));
        toast.error(res.error);
        return;
      }
      // Swap the optimistic row's client-generated id for the real one the
      // server just wrote. Without this, if the user immediately edits or
      // deletes the just-added row, we'd send our fake id back through
      // updateTransaction / deleteTransaction, which does .eq("id", ...)
      // against a uuid column and errors with "invalid input syntax for
      // type uuid".
      if (res.id) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === optimistic.id ? { ...t, id: res.id as string } : t,
          ),
        );
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

  function handleDeleteEditing() {
    if (!editingId) return;
    const target = transactions.find((t) => t.id === editingId);
    if (!target) return;
    setOpen(false);
    setEditingId(null);
    handleDelete(target);
  }

  useRegisterFab(
    { label: "Add transaction", icon: Plus, onClick: handleOpenAdd },
    [],
  );

  return (
    <>
      {/* Header lives here rather than in page.tsx because the filters sit
          on the title line and are client state. PageHeader already has an
          `actions` slot for exactly this, so it stays on the shared type
          scale instead of a hand-rolled heading. */}
      <PageHeader
        title="Personal Finance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={range}
              onValueChange={(v) => v && setRange(v as RangeKey)}
            >
              <SelectTrigger className="w-36" aria-label="Time range">
                <SelectValue>
                  {(v) => RANGE_LABELS[v as RangeKey] ?? "Range"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RANGE_LABELS) as RangeKey[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {RANGE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(v) => v && setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger className="w-32" aria-label="Transaction type">
                <SelectValue>
                  {(v) => TYPE_LABELS[v as TypeFilter] ?? "Type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-4 pb-16 md:px-8 mt-6">
        <div className="flex gap-3">
          <CardFrame className="min-w-0 max-w-44 flex-1">
            <CardFrameHeader className="py-1">
              <CardFrameTitle>Income</CardFrameTitle>
            </CardFrameHeader>
            <Card>
              <CardPanel className="mx-auto min-w-0 py-4">
                <p
                  className={cn(
                    "break-words text-center font-bold",
                    metricTextSizeClass(formatMoneyCompact(rangeIncome)),
                  )}
                >
                  {formatMoneyCompact(rangeIncome)}
                </p>
              </CardPanel>
            </Card>
          </CardFrame>
          <CardFrame className="min-w-0 max-w-44 flex-1">
            <CardFrameHeader className="py-1 mx-auto">
              <CardFrameTitle>Spent</CardFrameTitle>
            </CardFrameHeader>
            <Card>
              <CardPanel className="mx-auto min-w-0 py-4">
                <p
                  className={cn(
                    "break-words text-center font-bold",
                    metricTextSizeClass(formatMoneyCompact(rangeExpense)),
                  )}
                >
                  {formatMoneyCompact(rangeExpense)}
                </p>
              </CardPanel>
            </Card>
          </CardFrame>
          <CardFrame className="min-w-0 max-w-44 flex-1">
            <CardFrameHeader className="py-1 mx-auto">
              <CardFrameTitle>Net</CardFrameTitle>
            </CardFrameHeader>
            <Card>
              <CardPanel className="mx-auto min-w-0 py-4">
                <p
                  className={cn(
                    "break-words text-center font-bold",
                    metricTextSizeClass(
                      formatMoneyCompact(rangeIncome - rangeExpense),
                    ),
                  )}
                >
                  {formatMoneyCompact(rangeIncome - rangeExpense)}
                </p>
              </CardPanel>
            </Card>
          </CardFrame>
        </div>
        <div className="flex justify-end">
          <ResponsiveDialog open={open} onOpenChange={setOpen}>
            <ResponsiveDialogTrigger
              render={
                <Button
                  className="hidden md:inline-flex"
                  onClick={handleOpenAdd}
                />
              }
            >
              <Plus />
              Add transaction
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>
                  {editingId ? "Edit transaction" : "Add a transaction"}
                </ResponsiveDialogTitle>
              </ResponsiveDialogHeader>
              <ResponsiveDialogPanel className="flex flex-col gap-5">
                <Tabs
                  className="mx-auto"
                  value={type}
                  onValueChange={(v) => setType(v as TransactionType)}
                >
                  <TabsList>
                    <TabsTab value="expense">Expense</TabsTab>
                    <TabsTab value="income">Income</TabsTab>
                  </TabsList>
                </Tabs>

                <div className="flex flex-col items-center gap-1 py-2">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-2xl font-bold",
                        type === "income"
                          ? "text-rf-green-deep"
                          : "text-rf-coral",
                      )}
                    >
                      {type === "income" ? "+" : "−"}
                    </span>
                    {/* A bare <input>, not our <Input>: with
                        nativeInput + unstyled the wrapper adds nothing we
                        want, but it does put a fixed `h-8.5 leading-8.5`
                        (34px) on the inner element — which is what was
                        slicing the top and bottom off a 48px figure. */}
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="1"
                      // biome-ignore lint/a11y/noAutofocus: amount is the one field this dialog exists to capture
                      autoFocus
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      aria-label="Amount"
                      style={{ width: amountFieldWidth(amount) }}
                      className={cn(
                        "max-w-full border-none bg-transparent p-0 text-center font-extrabold text-ink tabular-nums leading-[1.15] outline-none placeholder:text-body-muted/30",
                        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                        amountTextSizeClass(amount),
                      )}
                    />
                  </div>
                </div>

                {/* Selected state uses the same green-pale treatment as the
                  Space filter pills further down. It was `secondary` vs
                  `outline` before — two near-identical greys, so you
                  couldn't tell which date was actually active. */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={occurredOn === todayKey}
                    onClick={() => setOccurredOn(todayKey)}
                    className={cn(
                      occurredOn === todayKey &&
                        "border-rf-green-deep bg-g-green-pale text-rf-green-deep hover:bg-g-green-pale",
                    )}
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={occurredOn === yesterdayKey}
                    onClick={() => setOccurredOn(yesterdayKey)}
                    className={cn(
                      occurredOn === yesterdayKey &&
                        "border-rf-green-deep bg-g-green-pale text-rf-green-deep hover:bg-g-green-pale",
                    )}
                  >
                    Yesterday
                  </Button>
                  <Input
                    type="date"
                    nativeInput
                    value={occurredOn}
                    onChange={(e) => setOccurredOn(e.target.value)}
                    className={cn(
                      "w-36",
                      // A custom date is just as "selected" as the presets —
                      // without this, picking one left nothing highlighted.
                      occurredOn !== todayKey &&
                        occurredOn !== yesterdayKey &&
                        "border-rf-green-deep text-rf-green-deep",
                    )}
                  />
                </div>

                <div className="flex flex-col gap-3">
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
              </ResponsiveDialogPanel>
              <ResponsiveDialogFooter>
                {editingId ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleDeleteEditing}
                      className="text-rf-coral hover:text-rf-coral"
                    >
                      <Trash2 />
                      Delete
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={handleSubmit}
                      disabled={!amount.trim()}
                    >
                      Save changes
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!amount.trim()}
                  >
                    Add
                  </Button>
                )}
              </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
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
                  {/* <div className="flex items-baseline justify-between px-1">
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
                </div> */}
                  <Frame className="w-full">
                    <Table variant="card">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{dayLabel(date, today)}</TableHead>
                          <TableHead></TableHead>
                          {/* <TableHead></TableHead> */}
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((t) => (
                          // biome-ignore lint/a11y/useSemanticElements: a <tr> cannot be a <button>; row-level click needs role+tabIndex
                          <TableRow
                            key={t.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Edit ${t.description || t.category || "transaction"}`}
                            onClick={() => handleOpenEdit(t)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleOpenEdit(t);
                              }
                            }}
                            className="cursor-pointer transition-colors hover:bg-muted/40"
                          >
                            <TableCell className="font-medium">
                              {t.description || t.category || "Untitled"}
                            </TableCell>
                            <TableCell>
                              {/* Only render the badge when there's something to
                                put in it — an unlabelled transaction was
                                drawing an empty outlined pill. */}
                              {t.category || t.space ? (
                                <Badge variant="outline">
                                  {t.category ? (
                                    <span>{t.category}</span>
                                  ) : null}
                                  {t.space ? (
                                    <span className="rounded-full bg-line px-1.5 py-0.5">
                                      {t.space}
                                    </span>
                                  ) : null}
                                </Badge>
                              ) : null}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right tabular-nums",
                                t.type === "income"
                                  ? "text-rf-green-deep"
                                  : "text-rf-coral",
                              )}
                            >
                              {t.type === "income" ? "+" : "-"}
                              {formatMoney(t.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2}>Net</TableCell>
                          <TableCell className="text-right">
                            {" "}
                            <span
                              className={cn(
                                "tabular-nums text-xs font-semibold",
                                net >= 0
                                  ? "text-rf-green-deep"
                                  : "text-rf-coral",
                              )}
                            >
                              {net >= 0 ? "+" : "-"}
                              {formatMoney(Math.abs(net))}
                            </span>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </Frame>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
