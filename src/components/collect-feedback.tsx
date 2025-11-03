import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { MdRateReview } from "react-icons/md";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";

export default function CollectFeedback({
  text = "Feedback",
}: {
  text: string;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={"Feedback"} asChild>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <MdRateReview className="text-green-950 size-6! " />
              {text}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send us feedback</DialogTitle>
              <DialogDescription>
                Watch{" "}
                <a className="text-foreground hover:underline" href="#">
                  tutorials
                </a>
                , read coss.com&lsquo;s{" "}
                <a className="text-foreground hover:underline" href="#">
                  documentation
                </a>
                , or join our{" "}
                <a className="text-foreground hover:underline" href="#">
                  Discord
                </a>{" "}
                for community help.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-5">
              <Textarea
                id="feedback"
                placeholder="How can we improve coss.com?"
                aria-label="Send feedback"
              />
              <div className="flex flex-col sm:flex-row sm:justify-end">
                <Button type="button">Send feedback</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
