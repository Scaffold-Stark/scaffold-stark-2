// SPDX-License-Identifier: MIT
// @author : Carlos Ramos
// @notice :  contract handles all interactions related to l1 campaigns
#[starknet::interface]
pub trait ICrossFundAlt<TContractState> {
    fn get_campaign(self : @TContractState, campaign_id: u256) -> (u256, u8);
    fn deposit(ref self: TContractState, campaign_id: u256, amount: u256);
}
#[starknet::component]
pub mod CrossFundAltComponent {
    use starknet::{EthAddress, ContractAddress, get_caller_address, get_contract_address};
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};

    use super::{ICrossFundAlt};

    #[storage]
    struct Storage {

        base_token: ContractAddress,
        // the target contract on l1
        campaign_raised_amount: LegacyMap<u256, u256>, // TODO use checkpoints
        campaign_status: LegacyMap<u256, u8>, // active : 0, inactive : 1
    }


    #[embeddable_as(CrossFundAltImpl)]
    impl CrossFundAlt<TContractState, +HasComponent<TContractState>> of ICrossFundAlt<ComponentState<TContractState>>{
        fn get_campaign(self: @ComponentState<TContractState>, campaign_id: u256) -> (u256, u8) {
            self._get_campaign(campaign_id)
        }

        fn deposit(ref self: ComponentState<TContractState>, campaign_id: u256, amount: u256) {
            self._deposit(campaign_id, amount);
        }
    }

    #[generate_trait]
    pub impl InternalImpl<TContractState, +HasComponent<TContractState>> of InternalTrait<TContractState> {
        fn initialize(ref self: ComponentState<TContractState>, base_token: ContractAddress) {
            self.base_token.write(base_token);
        }
        fn _deposit(
            ref self: ComponentState<TContractState>,
            campaign_id: u256,
            amount: u256,
        ) {
            self._assert_campaign_active(campaign_id);
            let token = self.base_token.read();
            let is_success = IERC20CamelDispatcher { contract_address: token }.transferFrom(get_caller_address(), get_contract_address(), amount);
            assert(is_success, 'transfer failed');

            let raised_amount = self.campaign_raised_amount.read(campaign_id);
            let new_raised_amount = raised_amount + amount;
            self.campaign_raised_amount.write(campaign_id, new_raised_amount);
        }

        fn _deactivate_campaign(
            ref self: ComponentState<TContractState>,
            campaign_id: u256,
        ) {
            self._assert_campaign_active(campaign_id);
            self.campaign_status.write(campaign_id, 1);
        }

        fn _assert_campaign_active(
            self: @ComponentState<TContractState>,
            campaign_id: u256,
        ) {
            let status = self.campaign_status.read(campaign_id);
            assert(status == 0, 'campaign is not active');
        }

        fn _withdraw(
            ref self: ComponentState<TContractState>,
            campaign_id: u256,
            beneficiary: ContractAddress,
        ) {
            self._assert_campaign_active(campaign_id);
            let raised_amount = self.campaign_raised_amount.read(campaign_id);
            self.campaign_raised_amount.write(campaign_id, 0);
            let token = self.base_token.read();
            IERC20CamelDispatcher { contract_address: token }.transfer(beneficiary, raised_amount);
        }

        fn _get_campaign(
            self: @ComponentState<TContractState>,
            campaign_id: u256,
        ) -> (u256, u8) {
            let amount_raised = self.campaign_raised_amount.read(campaign_id);
            let status = self.campaign_status.read(campaign_id);
            (amount_raised, status)
        }
    }
}