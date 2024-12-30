import Image from "next/image";

export const movingCardItems: {
  quote: string;
  image?: React.ReactNode;
}[] = [
  {
    quote: "Crypto Bets",
    image: (
      <Image
        src={"/bitcoin-paysage2.jpg"}
        alt={"bitcoin"}
        width={450}
        height={50}
        className="h-full w-full"
      />
    ),
  },
  {
    quote: "Political bets",
    image: (
      <Image
        src={"/politics.jpg"}
        alt={"bitcoin"}
        width={450}
        height={50}
        className="h-full w-full"
      />
    ),
  },
  {
    quote: "Sports Bets",
    image: (
      <Image
        src={"/sports.png"}
        alt={"bitcoin"}
        width={626}
        height={432}
        className="h-full w-full"
      />
    ),
  },
  {
    quote: "Degens Bets",
    image: (
      <Image
        src={"/pepe.png"}
        alt={"bitcoin"}
        width={350}
        height={50}
        className="h-full w-full"
      />
    ),
  },
  {
    quote: "Crypto Bets",
    image: (
      <Image
        src={"/bitcoin-paysage2.jpg"}
        alt={"bitcoin"}
        width={450}
        height={50}
        className="h-full w-full"
      />
    ),
  },
  {
    quote: "Political bets",
    image: (
      <Image
        src={"/politics.jpg"}
        alt={"bitcoin"}
        width={450}
        height={50}
        className="h-full w-full"
      />
    ),
  },
  {
    quote: "Sports Bets",
    image: (
      <Image
        src={"/sports.png"}
        alt={"bitcoin"}
        width={626}
        height={432}
        className="h-full w-full"
      />
    ),
  },
  {
    quote: "Degens Bets",
    image: (
      <Image
        src={"/pepe.png"}
        alt={"bitcoin"}
        width={350}
        height={50}
        className="h-full w-full"
      />
    ),
  },
];

export const BetTokenImage = {
  Eth: "/ethereum-eth-logo.png",
  Usdc: "/usd-coin-usdc-logo.png",
};

export enum BetType {
  CRYPTO = "Crypto",
  SPORTS = "Sports",
  OTHER = "Other",
}

export enum PositionType {
  Yes = "Yes",
  No = "No",
}

export enum NolossBetVariants {
  NIMBORA = "Nimbora",
  NOSTRA = "Nostra",
}
