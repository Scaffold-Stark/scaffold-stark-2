use core::array::ArrayTrait;
use core::option::OptionTrait;
use starknet::SyscallResultTrait;
use starknet::storage_access::StorageBaseAddress;
use starknet::{Store, SyscallResult};

impl StoreFelt252Array of Store<Array<felt252>> {
    fn read(address_domain: u32, base: StorageBaseAddress) -> SyscallResult<Array<felt252>> {
        StoreFelt252Array::read_at_offset(address_domain, base, 0)
    }

    fn write(
        address_domain: u32, base: StorageBaseAddress, value: Array<felt252>
    ) -> SyscallResult<()> {
        StoreFelt252Array::write_at_offset(address_domain, base, 0, value)
    }

    fn read_at_offset(
        address_domain: u32, base: StorageBaseAddress, mut offset: u8
    ) -> SyscallResult<Array<felt252>> {
        let mut arr: Array<felt252> = array![];

        let len: u8 = Store::<u8>::read_at_offset(address_domain, base, offset)
            .expect('Storage Span too large');
        offset += 1;

        let exit = len + offset;
        loop {
            if offset >= exit {
                break;
            }

            let value = Store::<felt252>::read_at_offset(address_domain, base, offset).unwrap();
            arr.append(value);
            offset += Store::<felt252>::size();
        };

        Result::Ok(arr)
    }

    fn write_at_offset(
        address_domain: u32, base: StorageBaseAddress, mut offset: u8, mut value: Array<felt252>
    ) -> SyscallResult<()> {
        let len: u8 = value.len().try_into().expect('Storage - Span too large');
        Store::<u8>::write_at_offset(address_domain, base, offset, len).unwrap();
        offset += 1;

        loop {
            let element = value.pop_front();
            if (element.is_some()) {
                Store::<felt252>::write_at_offset(address_domain, base, offset, element.unwrap())
                    .unwrap();
                offset += Store::<felt252>::size();
            } else {
                break;
            }
        };

        Result::Ok(())
    }

    fn size() -> u8 {
        255 * Store::<felt252>::size()
    }
}

#[starknet::interface]
pub trait IStoreArrayContract<TContractState> {
    fn store_array(ref self: TContractState, arr: Array<felt252>);
    fn read_array(self: @TContractState) -> Array<felt252>;
}

#[starknet::contract]
mod StoreArrayContract {
    use super::StoreFelt252Array;

    #[storage]
    struct Storage {
        arr: Array<felt252>
    }

    #[abi(embed_v0)]
    impl StoreArrayImpl of super::IStoreArrayContract<ContractState> {
        fn store_array(ref self: ContractState, arr: Array<felt252>) {
            self.arr.write(arr);
        }

        fn read_array(self: @ContractState) -> Array<felt252> {
            self.arr.read()
        }
    }
}
