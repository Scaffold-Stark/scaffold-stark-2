export async function GET(_: Request) {
  const apiUrl =
    "https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd";

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`coingecko response status: ${response.status}`);
    }
    const json = await response.json();
    return Response.json(json);
  } catch (e) {
    return Response.json({
      starknet: { usd: 0 },
    });
  }
}
