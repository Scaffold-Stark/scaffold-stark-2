# NEXTJS

## External Image Source Configuration

In the `next.config.mjs`, we've set up external image sources using `remotePatterns` to allow fetching assets from specific domains. This is particularly useful for loading images or assets from external servers or services.

```javascript
remotePatterns: [
  // External image source for StarkNet ID identicons
  {
    protocol: "https",
    hostname: "identicon.starknet.id",
    pathname: "/**", // Allows all paths under this domain
  },
  // External image source for images hosted on Starkurabu
  {
    protocol: "https",
    hostname: "img.starkurabu.com",
    pathname: "/**",
  },
],

```
