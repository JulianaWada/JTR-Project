import { Icon, type IconName } from "@/components/ui/Icon";
import { siteConfig } from "@/content/site";

type Props = { label: string; newTabLabel: string; className?: string };

/** Round icon links to JTR's social profiles (siteConfig.social). Used in the hero and the footer. */
export function SocialLinks({ label, newTabLabel, className = "" }: Props) {
  return (
    <ul className={`flex gap-2 ${className}`} aria-label={label}>
      {siteConfig.social.map((s) => (
        <li key={s.id}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-grid size-10 place-items-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <Icon name={s.id as IconName} size={18} />
            <span className="sr-only">
              {s.label} {newTabLabel}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
