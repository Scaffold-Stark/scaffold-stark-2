export async function GET(
  _: Request,
  props: { params: Promise<{ symbol: string }> },
) {
  const params = await props.params;

  const { symbol } = params;

  let apiUrl = "";
  if (symbol === "ETH") {
    apiUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
  } else if (symbol === "STRK") {
    apiUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd";
  } else {
    return Response.json({
      ethereum: { usd: 0 },
      starknet: { usd: 0 },
    });
  }
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`coingecko response status: ${response.status}`);
    }
    const json = await response.json();
    return Response.json(json);
  } catch (e) {
    return Response.json({
      ethereum: { usd: 0 },
      starknet: { usd: 0 },
    });
  }
}
