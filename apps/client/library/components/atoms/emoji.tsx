import { cn } from "@/library/utils";

interface IEmoji {
  className?: string;
  emoji: string;
}

const Emoji = ({ className, emoji }: IEmoji) => {
  let unicode = emoji
    .split("-")
    .map((val) => {
      return String.fromCodePoint(parseInt(val, 16));
    })
    .join("");

  return (
    <p className={cn("aspect-square grid place-items-center", className)}>
      <span className="inline-block">{unicode}</span>
    </p>
  );
};

export default Emoji;
