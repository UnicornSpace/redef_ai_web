"use client";

import type React from "react";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

/**
 * Drawer on mobile, centered Dialog on desktop — the responsive overlay
 * pattern coss documents (p-drawer-12), built once so every "add X" /
 * detail flow in the app shares it instead of re-implementing the switch.
 */

type RootProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

export function ResponsiveDialog(props: RootProps): React.ReactElement {
  const isMobile = useIsMobile();
  return isMobile ? <Drawer {...props} /> : <Dialog {...props} />;
}

export function ResponsiveDialogTrigger({
  className,
  children,
  render,
}: {
  className?: string;
  children?: React.ReactNode;
  render?: React.ReactElement;
}): React.ReactElement {
  const isMobile = useIsMobile();
  const Trigger = isMobile ? DrawerTrigger : DialogTrigger;
  return (
    <Trigger className={className} render={render}>
      {children}
    </Trigger>
  );
}

export function ResponsiveDialogContent({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}): React.ReactElement {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <DrawerPopup className={className} showBar>
        {children}
      </DrawerPopup>
    );
  }
  return <DialogPopup className={className}>{children}</DialogPopup>;
}

export function ResponsiveDialogHeader({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}): React.ReactElement {
  const isMobile = useIsMobile();
  const Header = isMobile ? DrawerHeader : DialogHeader;
  return <Header className={className}>{children}</Header>;
}

export function ResponsiveDialogTitle({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const isMobile = useIsMobile();
  const Title = isMobile ? DrawerTitle : DialogTitle;
  return <Title>{children}</Title>;
}

export function ResponsiveDialogDescription({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const isMobile = useIsMobile();
  const Description = isMobile ? DrawerDescription : DialogDescription;
  return <Description>{children}</Description>;
}

export function ResponsiveDialogPanel({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}): React.ReactElement {
  const isMobile = useIsMobile();
  const Panel = isMobile ? DrawerPanel : DialogPanel;
  return <Panel className={className}>{children}</Panel>;
}

export function ResponsiveDialogFooter({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}): React.ReactElement {
  const isMobile = useIsMobile();
  const Footer = isMobile ? DrawerFooter : DialogFooter;
  return <Footer className={className}>{children}</Footer>;
}

export function ResponsiveDialogClose({
  className,
  children,
  render,
}: {
  className?: string;
  children?: React.ReactNode;
  render?: React.ReactElement;
}): React.ReactElement {
  const isMobile = useIsMobile();
  const Close = isMobile ? DrawerClose : DialogClose;
  return (
    <Close className={className} render={render}>
      {children}
    </Close>
  );
}
