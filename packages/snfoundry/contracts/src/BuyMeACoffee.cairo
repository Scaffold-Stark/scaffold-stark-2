#[starknet::interface]
pub trait IBuyMeACoffee<TContractState> {
    /// Allows a user to send a tip to the contract owner.
    /// # Arguments
    /// * `amount` - The amount of the tip token to send.
    /// * `message` - A message to accompany the tip.
    fn buy_coffee(ref self: TContractState, amount: u256, message: ByteArray);
    /// Allows the owner to withdraw the entire balance of the tip token from the contract.
    fn withdraw(ref self: TContractState);
    /// Returns an array of all tips received.
    fn get_tips(self: @TContractState) -> Array<Tip>;
    /// Returns the owner of the contract.
    fn get_owner(self: @TContractState) -> starknet::ContractAddress;
}

#[starknet::contract]
mod BuyMeACoffee {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::Tip;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        tip_token_address: ContractAddress,
        tips: LegacyMap<u32, Tip>,
        tips_count: u32,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        TipReceived: TipReceived,
    }

    #[derive(Drop, starknet::Event)]
    struct TipReceived {
        #[key]
        tipper: ContractAddress,
        amount: u256,
        message: ByteArray,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, owner_address: ContractAddress, tip_token: ContractAddress,
    ) {
        self.ownable.initializer(owner_address);
        self.tip_token_address.write(tip_token);
    }

    #[abi(embed_v0)]
    impl IBuyMeACoffeeImpl of super::IBuyMeACoffee<ContractState> {
        fn buy_coffee(ref self: ContractState, amount: u256, message: ByteArray) {
            assert(amount > 0, 'Tip amount must be > 0');
            let tipper = get_caller_address();
            let contract_address = get_contract_address();
            let token_dispatcher = IERC20Dispatcher {
                contract_address: self.tip_token_address.read(),
            };
            token_dispatcher.transfer_from(tipper, contract_address, amount);
            let tip_id = self.tips_count.read();
            self.tips.write(tip_id, Tip { tipper, amount, message: message.clone() });
            self.tips_count.write(tip_id + 1);
            self.emit(TipReceived { tipper, amount, message });
        }

        fn withdraw(ref self: ContractState) {
            self.ownable.assert_only_owner();
            let owner_address = self.ownable.owner();
            let contract_address = get_contract_address();
            let token_dispatcher = IERC20Dispatcher {
                contract_address: self.tip_token_address.read(),
            };
            let balance = token_dispatcher.balance_of(contract_address);
            if balance > 0 {
                token_dispatcher.transfer(owner_address, balance);
            }
        }

        fn get_tips(self: @ContractState) -> Array<Tip> {
            let mut all_tips = array![];
            let count = self.tips_count.read();
            let mut i = 0_u32;
            loop {
                if i >= count {
                    break;
                }
                all_tips.append(self.tips.read(i));
                i += 1;
            }
            all_tips
        }

        fn get_owner(self: @ContractState) -> starknet::ContractAddress {
            self.ownable.owner()
        }
    }
}

#[derive(Drop, starknet::Store, Serde)]
pub struct Tip {
    tipper: starknet::ContractAddress,
    amount: u256,
    message: ByteArray,
}

