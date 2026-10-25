import { BotMessageSquareIcon, CalendarClockIcon, FileSearchIcon, GaugeIcon, HandshakeIcon, MessageCircleIcon, ShieldCheckIcon, SmartphoneIcon, SparklesIcon, UserIcon, WalletIcon, WebhookIcon, type LucideIcon } from "lucide-react";
import { siNeon, siNextdotjs, siPaypal, siVercel } from "simple-icons";
import { AgentCrate } from "@/components/brand/agent-crate";
import type { Logo } from "@/lib/architecture";
import { cn } from "@/lib/utils";

// Real brand marks where a vendor is the node (simple-icons, CC0), and plain icons for Spoilclock's own parts.
// OpenAI isn't in simple-icons, so it gets a plain icon.
const BRANDS = { paypal: siPaypal, vercel: siVercel, neon: siNeon, nextjs: siNextdotjs } as const;
const ICONS: Partial<Record<Logo, LucideIcon>> = { person: UserIcon, webhook: WebhookIcon, chat: MessageCircleIcon, shield: ShieldCheckIcon, gauge: GaugeIcon, openai: BotMessageSquareIcon, phone: SmartphoneIcon, schedule: CalendarClockIcon, buyers: HandshakeIcon, money: WalletIcon, read: FileSearchIcon };

export function NodeLogo({ logo, className }: { logo: Logo; className?: string }) {
  if (logo === "agent") return <AgentCrate mood="idle" className={cn("w-10 shrink-0", className)} />;
  if (logo in BRANDS) {
    const icon = BRANDS[logo as keyof typeof BRANDS];
    return (
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg border bg-white", className)}>
        <svg viewBox="0 0 24 24" role="img" aria-label={icon.title} className="size-5" fill={`#${icon.hex}`}>
          <path d={icon.path} />
        </svg>
      </span>
    );
  }
  const Icon = ICONS[logo] ?? SparklesIcon;
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg border bg-parchment text-ink", (logo === "shield" || logo === "gauge") && "text-forest", logo === "money" && "text-turning", className)}>
      <Icon aria-hidden className="size-[18px]" />
    </span>
  );
}
