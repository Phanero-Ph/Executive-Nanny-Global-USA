import Image, { type ImageProps } from "next/image";

/**
 * Public marketing images must be served directly by their origin. The shared
 * host's Next image optimizer has returned blank/error responses for both
 * remote photos and local assets, so bypass it per image rather than relying
 * on deployment-specific image configuration.
 */
export function PublicImage(props: ImageProps) {
  return <Image {...props} alt={props.alt ?? ""} unoptimized />;
}
