module sui_fusion_swap::locking {
    /// Locking Abstraction Struct
    public struct Locked<T:store> has store, key {
        id: UID,
        key: ID,
        obj: T,
    }

    /// Key Abstraction Struct
    public struct Key has key, store {
        id: UID,
    }

    /// Error codes
    const E_KEY_MISMATCH: u64 = 1;

    /// Implementation of a generic lock function
    public fun lock<T: store> (ctx:&mut TxContext, obj: T) : (Locked<T>, Key){
        let key = Key {id: object::new(ctx)};
        let lock = Locked {
            id: object::new(ctx),
            key: object::id(&key),
            obj: obj,
        };
        (lock, key)
    }

    /// Implementation of a generic unlock function
    public fun unlock<T: store> (locked: Locked<T>, key: Key):T{
        assert!(locked.key == object::id(&key), E_KEY_MISMATCH);
        let Key { id } = key;
        object::delete(id);

        let Locked { id, key: _ , obj } = locked;
        object::delete(id);

        obj
    }

    /// Tests
    #[test_only] use sui::test_scenario::{Self as ts, Scenario};
    #[test_only] use sui_fusion_swap::basic_token::Balance;
    #[test_only] use sui_fusion_swap::basic_token::BasicToken;
    #[test_only] use sui_fusion_swap::basic_token::basic_token_mint;
                 use sui_fusion_swap::basic_token::burn;
    #[test_only]
    fun mint_basic_token() : BasicToken {
        basic_token_mint(42)
    }

    #[test]
    fun test_lock_unlock() {
        let mut ts = ts::begin(@0xA);
        let basic_token = mint_basic_token();

        let (locked, key) = lock(ts::ctx(&mut ts),basic_token);

        let basic_token = unlock(locked,key);

        burn(basic_token);
        ts::end(ts);
    }
}