use starknet::{ContractAddress, get_block_timestamp, EthAddress};

// SPDX-License-Identifier: MIT
// @author : Carlos Ramos
// @notice :  contract handles all interactions related to l1 campaigns


#[derive(Drop, Serde)]
struct Message {
    campaign_id: felt252,
    status: felt252,
    recipient: felt252,
}

#[starknet::interface]
pub trait ICrossFund<TContractState> {
    fn withdraw(ref self: TContractState, campaign_id: u256, l1_beneficiary: EthAddress);
    fn deposit_to_strk_campaign(ref self: TContractState, campaign_id: u256, amount: u256);
    fn deposit_to_eth_campaign(ref self: TContractState, campaign_id: u256, amount: u256);
}

#[starknet::contract]
mod CrossFund {
    use contracts::CrossFundNative::ICrossFundNative;
    use contracts::CrossFundAlt::CrossFundAltComponent;
    use contracts::CrossFundNative::CrossFundNativeComponent;
    use core::traits::TryInto;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use starknet::{get_caller_address, get_contract_address, EthAddress, SyscallResultTrait};
    use starknet::syscalls::send_message_to_l1_syscall;
    use super::{ContractAddress, Message, get_block_timestamp, ICrossFund};
    use core::num::traits::Zero;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: CrossFundAltComponent, storage: cross_fund_alt, event: CrossFundMessengerEvent);
    component!(path: CrossFundNativeComponent, storage: cross_fund_native, event: CrossFundNativeEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl CrossFundAlt = CrossFundAltComponent::CrossFundAltImpl<ContractState>;
    impl CrossFundNative = CrossFundNativeComponent::CrossFundNativeImpl<ContractState>;


    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl CrossFundAltInternalImpl = CrossFundAltComponent::InternalImpl<ContractState>;
    impl CrossFundNativeInternalImpl = CrossFundNativeComponent::InternalImpl<ContractState>;


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        CrossFundMessengerEvent: CrossFundAltComponent::Event,
        #[flat]
        CrossFundNativeEvent: CrossFundNativeComponent::Event,
        StrkCampaignCreated: StrkCampaignCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct StrkCampaignCreated {
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
        target_contract: EthAddress,

        // starknet campaigns
        strk_campaign_counter: u256,
        strk_campaign_target_amount: LegacyMap<u256, u256>,
        strk_campaign_raised_amount: LegacyMap<u256, u256>,
        strk_campaign_duration: LegacyMap<u256, u256>,
        strk_campaign_start_time: LegacyMap<u256, u256>,
        strk_campaign_data_cid: LegacyMap<u256, ByteArray>,
        strk_campaign_owner: LegacyMap<u256, ContractAddress>,
        strk_campaign_is_active: LegacyMap<u256, bool>,

        // ethereum campaigns
        eth_campaign_amount_raised: LegacyMap<u256, u256>,

        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        cross_fund_alt: CrossFundAltComponent::Storage,
        #[substorage(v0)]
        cross_fund_native: CrossFundNativeComponent::Storage,
    }

    #[abi(embed_v0)]
    impl CrossFundImpl of ICrossFund<ContractState> {
        fn withdraw(ref self: ContractState, campaign_id: u256, l1_beneficiary: EthAddress) {
            let status = self.cross_fund_native._withdraw(campaign_id);

            let mut l2_message = Message {
                campaign_id: campaign_id.try_into().unwrap(),
                status: status.try_into().unwrap(),
                recipient: l1_beneficiary.try_into().unwrap(),
            };

            let mut buf: Array<felt252> = array![];
            l2_message.serialize(ref buf);
            let to_address: EthAddress = self.target_contract.read();

            send_message_to_l1_syscall(to_address.into(), buf.span()).unwrap_syscall();
        }
        fn deposit_to_strk_campaign(ref self: ContractState, campaign_id: u256, amount: u256) {
            self.cross_fund_native.deposit(campaign_id, amount);
        }
        fn deposit_to_eth_campaign(ref self: ContractState, campaign_id: u256, amount: u256) {
            self.cross_fund_alt.deposit(campaign_id, amount);
        }   
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, base_token: ContractAddress) {
        // self.ownable.initializer(owner);
        self.strk_campaign_counter.write(1);
        self.base_token.write(base_token);
        self.cross_fund_alt.initialize(base_token);
        self.cross_fund_native.initialize(base_token);
    }

    #[l1_handler]
    fn l1_message(ref self: ContractState, from_address: felt252, l1_message: Message) {
        let l1_campaign_id: u256 = l1_message.campaign_id.try_into().unwrap();
        let l2_recipient: ContractAddress = l1_message.recipient.try_into().unwrap();
        let sender_address: EthAddress = from_address.try_into().unwrap();

        assert(sender_address == self.target_contract.read().into(), 'only target contract');

        let status: u8 = l1_message.status.try_into().unwrap();
        if status == 1 {
            self.cross_fund_alt._deactivate_campaign(l1_campaign_id);
        } else {
            self.cross_fund_alt._withdraw(l1_campaign_id, l2_recipient);
        }
    }
}