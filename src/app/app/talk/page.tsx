import { listChats } from "@/actions/chat";
import { TalkClient } from "@/components/talk/talk-client";
import { createClient } from "@/lib/server";

export default async function TalkPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.user_metadata?.email as string | undefined;
  const name = email?.split("@")[0];

  const chats = await listChats();

  return (
    <TalkClient
      initialChats={chats}
      greeting={name ? `How's it going, ${name}?` : "How's it going?"}
    />
  );
}
