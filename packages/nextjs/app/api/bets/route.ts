import prisma from '~~/prisma/db'

export async function GET(request: Request) {
    const bets = await prisma.bets.findMany()

    const serializedBets = JSON.stringify(bets.map(bet => ({
        ...bet,
        bet_id: bet.bet_id.toString(),
        deadline: bet.deadline.toString(),
        vote_deadline: bet.vote_deadline.toString(),
        total_money_betted: bet.total_money_betted.toString(),
        outcome_yes_bought_amount: bet.outcome_yes_bought_amount.toString(),
        outcome_yes_bought_amount_with_yield: bet.outcome_yes_bought_amount_with_yield.toString(),
        outcome_no_bought_amount: bet.outcome_no_bought_amount.toString(),
        outcome_no_bought_amount_with_yield: bet.outcome_no_bought_amount_with_yield.toString(),
      })))
      
    return new Response (JSON.stringify(serializedBets))
}