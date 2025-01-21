
sncast script run my_script --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

sncast --account account-1 script run my_script --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7


sncast account import --url https://starknet-sepolia.reddio.com/rpc/v0_7    --address 0x04097f4882C50bDdBaFe1A79337bDaBDf001456430aDede37F36E47E22d135De    --private-key 0x028a46eddc7615d00e21d31dc959d2721c3cc5b267e381b7fd4c7931f3e61dfe  --type argent


sncast account import --url http://127.0.0.0:5050    --address 0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec    --private-key 0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912  --type oz

sncast account import --url http://127.0.0.1:5050  --address 0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec --private-key 0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912 --type oz


sncast --account account-2 script run my_script --url http://127.0.0.1:5050