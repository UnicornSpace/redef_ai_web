"use client";

import type { UIMessage } from "ai";
import { History, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type ChatSummary,
  createChat,
  deleteChat,
  getChat,
} from "@/actions/chat";
import { ChatPane } from "@/components/talk/chat-pane";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function TalkClient({
  initialChats,
  greeting,
}: {
  initialChats: ChatSummary[];
  greeting: string;
}) {
  const [chats, setChats] = useState<ChatSummary[]>(initialChats);
  const [chatId, setChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (chatId) return;
    startTransition(async () => {
      const res = await createChat();
      if (res.id) {
        setChatId(res.id);
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  }, [chatId]);

  async function handleSelectChat(id: string) {
    const chat = await getChat(id);
    if (!chat) {
      toast.error("Could not load that chat");
      return;
    }
    setChatId(chat.id);
    setInitialMessages(chat.messages);
    setHistoryOpen(false);
  }

  function handleNewChat() {
    setChatId(null);
    setInitialMessages([]);
    setHistoryOpen(false);
  }

  async function handleDeleteChat(id: string) {
    const res = await deleteChat(id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === chatId) handleNewChat();
  }

  const visibleChats = chats.filter((c) => c.title);

  return (
    <div className="relative flex w-full flex-1 flex-col">
      <div className="absolute top-4 right-4 z-10 flex gap-2 md:top-6 md:right-8">
        <Button variant="outline" size="sm" onClick={handleNewChat}>
          <Plus />
          New chat
        </Button>
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger render={<Button variant="outline" size="sm" />}>
            <History />
            History
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Chat history</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-6 pb-6">
              {visibleChats.length === 0 ? (
                <p className="text-sm text-body-muted">
                  Your conversations will show up here.
                </p>
              ) : (
                visibleChats.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center gap-1 rounded-lg",
                      c.id === chatId && "bg-g-green-pale",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectChat(c.id)}
                      className="flex-1 truncate rounded-lg px-2 py-2 text-left text-sm text-ink hover:bg-line/40"
                    >
                      {c.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChat(c.id)}
                      aria-label="Delete chat"
                      className="shrink-0 p-2 text-body-muted hover:text-rf-coral"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {chatId ? (
        <ChatPane
          key={chatId}
          chatId={chatId}
          initialMessages={initialMessages}
          greeting={greeting}
        />
      ) : null}
    </div>
  );
}
