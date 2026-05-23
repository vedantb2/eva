import { MentionText } from "./MentionText";
import { UserMentionChip } from "./UserMentionChip";

interface UserMentionTextProps {
  text: string;
  className?: string;
}

/** Renders comment text with @user pills that show a profile card on hover. */
export function UserMentionText({ text, className }: UserMentionTextProps) {
  return (
    <MentionText
      text={text}
      className={className}
      renderMention={(match, key) => (
        <UserMentionChip key={key} userId={match.id} label={match.label} />
      )}
    />
  );
}
