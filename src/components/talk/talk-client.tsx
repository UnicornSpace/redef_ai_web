"use client";

import type { UIMessage } from "ai";
import { History, Plus, Settings2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
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
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useAutoSendVoice } from "@/hooks/use-talk-settings";
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
  const didAutoResume = useRef(false);
  const [autoSendVoice, setAutoSendVoice] = useAutoSendVoice();

  useEffect(() => {
    if (chatId) return;

    startTransition(async () => {
      // On first load, pick up the most recent real conversation instead
      // of dropping the user into a blank chat every time — otherwise
      // landing on Talk looks like your history disappeared even though
      // it's still there. Only happens once; explicit "New chat" clicks
      // (which also null out chatId) always start fresh from here on.
      if (!didAutoResume.current) {
        didAutoResume.current = true;
        const mostRecent = initialChats.find((c) => c.title);
        if (mostRecent) {
          const chat = await getChat(mostRecent.id);
          if (chat) {
            setChatId(chat.id);
            setInitialMessages(chat.messages);
            return;
          }
        }
      }

      const res = await createChat();
      if (res.id) {
        setChatId(res.id);
      } else if (res.error) {
        toast.error(res.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Popover>
          <PopoverTrigger
            render={
              <Button
                aria-label="Talk settings"
                size="icon"
                variant="outline"
              />
            }
          >
            <Settings2 />
          </PopoverTrigger>
          <PopoverPopup align="end" className="w-72">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-ink">
                  Auto-send voice notes
                </span>
                <span className="text-xs text-body-muted">
                  Off: transcription fills the input so you can review it
                  first. On: it sends the moment it's transcribed.
                </span>
              </div>
              <Switch
                checked={autoSendVoice}
                onCheckedChange={setAutoSendVoice}
              />
            </div>
          </PopoverPopup>
        </Popover>
        <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
          <DrawerTrigger render={<Button variant="outline" size="sm" />}>
            <History />
            History
          </DrawerTrigger>
          <DrawerPopup showBar>
            <DrawerHeader>
              <DrawerTitle>Chat history</DrawerTitle>
            </DrawerHeader>
            <DrawerPanel>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-rf-green-deep hover:bg-line/40"
                >
                  <Plus size={16} />
                  New chat
                </button>
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
            </DrawerPanel>
          </DrawerPopup>
        </Drawer>
      </div>

      {chatId ? (
        <ChatPane
          key={chatId}
          chatId={chatId}
          initialMessages={initialMessages}
          greeting={greeting}
          autoSendVoice={autoSendVoice}
        />
      ) : null}
    </div>
  );
}
