import Image from "next/image";

interface ProfileAvatarProps {
  src: string;
  alt: string;
  /** Tailwind size classes for width and height. */
  sizeClass?: string;
}

export function ProfileAvatar({
  src,
  alt,
  sizeClass = "size-16",
}: ProfileAvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={128}
      height={128}
      className={`${sizeClass} shrink-0 rounded-full border border-border object-cover`}
      priority
    />
  );
}
