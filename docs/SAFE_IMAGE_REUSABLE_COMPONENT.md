# SafeImage — `next/image` with native `<img>` fallback

Use this pattern in **any Next.js App Router project** where you show **remote images** (Unsplash, CDNs, OpenWeather icons, etc.). If **Next.js / Vercel Image Optimization** hits limits or errors (e.g. **HTTP 402** on the free tier, quota exceeded, or upstream failures), the default `<Image>` request can break. **`SafeImage`** tries **`next/image` first**; on **`onError`**, it re-renders with a plain **`<img src="…">`** pointing at the **same URL**, so the image usually **still displays** (no optimizer in the middle).

---

## When to use

- Remote `src` strings (HTTPS URLs).
- Gallery grids, hero photos, third-party icon URLs.
- Production on **Vercel** (or any host) where **`/_next/image`** might fail after optimization limits.

## When not to rely on the fallback

- **`src` is a `StaticImport`** (e.g. `import pic from './x.png'`). The fallback only switches when `typeof src === "string"` and non-empty. For static imports, `next/image` already serves optimized local assets; keep using `<Image>` or extend `SafeImage` if you need a custom fallback for those cases.

---

## Setup checklist (new project)

1. **`next.config.ts`** — allow remote hostnames (same as for `next/image`):

   ```ts
   images: {
     remotePatterns: [
       { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
       // …add each domain you use
     ],
   },
   ```

2. **Dependencies** — you already have `next`, `react`, and (if you use `cn`) `clsx` + `tailwind-merge` or your own `cn` helper.

3. **Copy the component** — place as e.g. `src/components/ui/safe-image.tsx` (or `Components/ui/safe-image.tsx`). Fix import paths (`@/lib/utils` → your alias).

4. **ESLint** — `@next/next/no-img-element` may warn on the fallback `<img>` lines; keep the **inline eslint-disable** comments (they document *why* `<img>` is intentional).

5. **Usage** — import `SafeImage` anywhere you would use `<Image>` for **remote** URLs:

   ```tsx
   import { SafeImage } from "@/components/ui/safe-image";

   // Fixed size
   <SafeImage
     src={url}
     alt="Description"
     width={400}
     height={300}
     className="rounded-lg object-cover"
   />

   // Fill parent (parent must be `position: relative` + sized, e.g. aspect box)
   <div className="relative aspect-video">
     <SafeImage
       src={url}
       alt="Description"
       fill
       className="object-cover"
       sizes="(max-width: 768px) 100vw, 50vw"
     />
   </div>
   ```

6. **Replace gradually** — search for `from "next/image"` / `<Image` on **remote** URLs only; keep **`Image`** for purely local static imports if you prefer.

---

## Full component (reference implementation)

> **Requires:** `"use client"` (uses `useState` / `onError`).  
> Adjust `import { cn } from "@/lib/utils"` to match your project.

```tsx
"use client";

import { cn } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";
import { useCallback, useState, type SyntheticEvent } from "react";

type SafeImageProps = ImageProps;

export function SafeImage({
  alt,
  src,
  className,
  fill,
  width,
  height,
  onError,
  priority,
  loading,
  ...rest
}: SafeImageProps) {
  const [useNative, setUseNative] = useState(false);
  const resolvedSrc = typeof src === "string" ? src : "";

  const handleError = useCallback(
    (e: SyntheticEvent<HTMLImageElement, Event>) => {
      onError?.(e);
      if (resolvedSrc) setUseNative(true);
    },
    [onError, resolvedSrc],
  );

  const eager = Boolean(priority || loading === "eager");

  if (useNative && resolvedSrc) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- fallback when /_next/image fails (e.g. 402)
        <img
          alt={alt}
          src={resolvedSrc}
          className={cn("absolute inset-0 h-full w-full", className)}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          sizes={typeof rest.sizes === "string" ? rest.sizes : undefined}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fallback when /_next/image fails (e.g. 402)
      <img
        alt={alt}
        src={resolvedSrc}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        className={cn(className)}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      {...rest}
      alt={alt}
      src={src}
      className={className}
      fill={fill}
      width={width}
      height={height}
      priority={priority}
      loading={loading}
      onError={handleError}
    />
  );
}
```

---

## Behaviour summary

| Stage | What happens |
| ----- | ------------ |
| First render | Renders Next.js **`<Image>`** (optimization, `srcset`, etc.). |
| Load succeeds | Same as normal `next/image`. |
| Load fails | `onError` runs → state flips → **`<img>`** with **original string `src`** (browser loads URL directly; **not** via `/_next/image`). |
| Optional `onError` prop | Still called before switching to native img. |

---

## For AI / collaborators (paste this instruction)

> In this Next.js app, **do not use raw `next/image` for remote URLs** in user-facing UI unless there is a reason. Prefer **`SafeImage`** from `@/…/safe-image.tsx`: it wraps **`next/image`** and falls back to an **unoptimized HTML `<img>`** with the same `src` when the optimized image request fails (e.g. Vercel Image Optimization quota / 402). Keep **`remotePatterns`** in `next.config` in sync with image domains. For **`fill`**, parent must be **`relative`** with explicit size; pass **`sizes`** when using fill for layout hints.

---

## This repo

- Implementation: [`components/ui/safe-image.tsx`](../components/ui/safe-image.tsx), [`components/ui/safe-avatar-image.tsx`](../components/ui/safe-avatar-image.tsx)
- Usage (REQ-0038/0040): product table/detail, ImageField preview, category/supplier product thumbs, QR code, auth shell SVG (`SafeImage`); **all avatars** use `SafeAvatarImage` with `getRoboHashAvatarUrl` / `resolveAvatarSourcesFromSeed` / `resolveUserAvatarSources` from [`lib/ui/user-avatar-sources.ts`](../lib/ui/user-avatar-sources.ts) (Navbar, Sidebar, reviews, ticket replies)
- `remotePatterns` in [`next.config.ts`](../next.config.ts): `robohash.org`, `ik.imagekit.io`, `**.googleusercontent.com`
