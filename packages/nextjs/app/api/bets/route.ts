import prisma from '~~/prisma/db'
import { type NextRequest } from 'next/server'
import { Bet } from '~~/types/bet'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page'))
    const itemsPerPage = Number(searchParams.get('itemsPerPage'))
    const skip = (page - 1)  * itemsPerPage;
    const bets = await prisma.$queryRaw<Bet[]>`
    SELECT bet_id, bet_type, name, image, category, description, is_settled, is_active, deadline, vote_deadline, 
           total_money_betted, yield_strategy_type, yield_strategy_name, yield_strategy_symbol, yield_strategy_address, 
           reference_price_key, reference_price, bet_condition, bet_token_name, bet_token_address, outcome_yes_name, 
           outcome_yes_bought_amount, outcome_yes_bought_amount_with_yield, outcome_no_name, outcome_no_bought_amount, 
           outcome_no_bought_amount_with_yield, winner_outcome 
    FROM bets WHERE upper_inf(_cursor)
    LIMIT ${itemsPerPage} OFFSET ${skip};
  `;

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
      
    return new Response (serializedBets)
}