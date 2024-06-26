// SPDX-License-Identifier: MIT
// @author : Carlos Ramos
// @notice :  contract handles all interactions related to native chain campaigns

use starknet::ContractAddress;
#[starknet::interface]
pub trait ICrossFundNative<TContractState> {
    fn create_campaign(ref self: TContractState, target_amount: u256, duration : u256, data_cid: ByteArray);
    fn deposit(ref self: TContractState, campaign_id: u256, amount: u256);
    fn get_campaign (self: @TContractState, campaign_id: u256) -> ((u256, u256, u256, u256), (ByteArray, ContractAddress, bool));
    fn get_all_campaigns (self: @TContractState) -> Array<( (u256, u256, u256, u256), (ByteArray, ContractAddress, bool))>;
}

#[starknet::component]
pub mod CrossFundNativeComponent {
    use core::array::ArrayTrait;
    use starknet::{EthAddress, ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use super::{ICrossFundNative};
    

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        CampaignCreated: CampaignCreated,
    }


    #[derive(Drop, starknet::Event)]
    struct CampaignCreated {
        #[key]
        campaign_id: u256,
        owner: ContractAddress,
        target_amount: u256,
        deadline: u256,
        data_cid: ByteArray,
    }

    #[storage]
    struct Storage {
        base_token: ContractAddress,
        // starknet campaigns
        campaign_counter: u256,
        campaign_target_amount: LegacyMap<u256, u256>,
        campaign_raised_amount: LegacyMap<u256, u256>,
        campaign_duration: LegacyMap<u256, u256>,
        campaign_start_time: LegacyMap<u256, u256>,
        campaign_data_cid: LegacyMap<u256, ByteArray>,
        campaign_owner: LegacyMap<u256, ContractAddress>,
        campaign_is_active: LegacyMap<u256, bool>,
    }


    #[embeddable_as(CrossFundNativeImpl)]
    impl CrossFundNative<TContractState, +HasComponent<TContractState>> of ICrossFundNative<ComponentState<TContractState>>{
        fn create_campaign(ref self: ComponentState<TContractState>, target_amount: u256, duration : u256, data_cid: ByteArray) {
            self._create_campaign(target_amount, duration, data_cid);
        }
        fn deposit(ref self: ComponentState<TContractState>, campaign_id: u256, amount: u256) {

            let token = self.base_token.read();
            let is_success = IERC20CamelDispatcher { contract_address: token }.transferFrom(get_caller_address(), get_contract_address(), amount);
            assert(is_success, 'transfer failed');

            let raised_amount = self.campaign_raised_amount.read(campaign_id);
            let new_raised_amount = raised_amount + amount;
            self.campaign_raised_amount.write(campaign_id, new_raised_amount);
        }

        fn get_campaign (self: @ComponentState<TContractState>, campaign_id: u256) -> ((u256, u256, u256, u256), (ByteArray, ContractAddress, bool)) {
            self._get_campaign(campaign_id)
        }

        fn get_all_campaigns (self: @ComponentState<TContractState>) -> Array<( (u256, u256, u256, u256), (ByteArray, ContractAddress, bool))> {
            let mut counter = self.campaign_counter.read();
            let mut campaigns = array![];

            loop {
                if(counter == 1) {
                    break;
                }
                let campaign = self._get_campaign(counter - 1);
                campaigns.append(campaign);
                counter -= 1;
            };

            campaigns
        }
    }

    #[generate_trait]
    pub impl InternalImpl<TContractState, +HasComponent<TContractState>> of InternalTrait<TContractState> {

        fn initialize(ref self: ComponentState<TContractState>, base_token: ContractAddress) {
            self.base_token.write(base_token);
            self.campaign_counter.write(1);
        }

        fn _create_campaign(ref self: ComponentState<TContractState>, target_amount: u256, duration : u256, data_cid: ByteArray) {
            // creates a campaign on this contract
            let block_timestamp:u256 = get_block_timestamp().try_into().unwrap();
            let campaign_id = self.campaign_counter.read();
            self.campaign_counter.write(campaign_id + 1);
            self.campaign_target_amount.write(campaign_id, target_amount);
            self.campaign_raised_amount.write(campaign_id, 0);
            self.campaign_duration.write(campaign_id, duration);
            self.campaign_start_time.write(campaign_id, block_timestamp);
            self.campaign_data_cid.write(campaign_id, data_cid.clone());
            self.campaign_owner.write(campaign_id, get_caller_address());
            self.campaign_is_active.write(campaign_id, true);
            self.emit(CampaignCreated { campaign_id: campaign_id, owner: get_caller_address(), target_amount, deadline: block_timestamp + duration, data_cid });
        }

        fn _get_campaign(self: @ComponentState<TContractState>, campaign_id: u256) -> ( (u256, u256, u256, u256), (ByteArray, ContractAddress, bool)) {
            let target_amount = self.campaign_target_amount.read(campaign_id);
            let raised_amount = self.campaign_raised_amount.read(campaign_id);
            let duration = self.campaign_duration.read(campaign_id);
            let start_time = self.campaign_start_time.read(campaign_id);
            let data_cid = self.campaign_data_cid.read(campaign_id);
            let owner = self.campaign_owner.read(campaign_id);
            let is_active = self.campaign_is_active.read(campaign_id);
            ((target_amount, raised_amount, duration, start_time), (data_cid, owner, is_active))
        }

        fn _deactivate_campaign(
            ref self: ComponentState<TContractState>,
            campaign_id: u256,
        ) {
            self._assert_campaign_active(campaign_id);
            self.campaign_is_active.write(campaign_id, false);
        }

        fn _assert_campaign_active(
            self: @ComponentState<TContractState>,
            campaign_id: u256,
        ) {
            let status = self.campaign_is_active.read(campaign_id);
            assert(status, 'campaign is not active');
        }

        fn _withdraw(
            ref self: ComponentState<TContractState>,
            campaign_id: u256,
        ) -> u8 {
            self._assert_campaign_active(campaign_id);
            self._deactivate_campaign(campaign_id);
            let raised_amount = self.campaign_raised_amount.read(campaign_id);
            let target_amount = self.campaign_target_amount.read(campaign_id);
            if raised_amount < target_amount {
                return 0;
            }
            let owner = self.campaign_owner.read(campaign_id);
            let token = self.base_token.read();
            IERC20CamelDispatcher { contract_address: token }.transfer(owner, raised_amount);
            return 1;
        }
    }
}