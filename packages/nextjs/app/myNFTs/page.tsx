import ButtonStyle from "~~/components/ButtonStyle/ButtonStyle"
import { MyHoldings } from "~~/components/SimpleNFT/MyHoldings"

function Page() {
    return (
        <main className="flex flex-col flex-1">
            <div className="flex flex-col items-center p-10">
                <h1>My NFTs</h1>
                <ButtonStyle>Mint NFT</ButtonStyle>
                <MyHoldings></MyHoldings>
            </div>
        </main>
    )
}

export default Page
