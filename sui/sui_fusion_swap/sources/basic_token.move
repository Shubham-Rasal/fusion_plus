module sui_fusion_swap::basic_token {
    /// Coin Abstraction Struct
    public struct BasicToken has store{
        value: u64,
    }

    /// Coin Access Abstraction Struct
    public struct Balance has key,store {
        id: sui::object::UID,
        coins: BasicToken
    }

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_ALREADY_INITIALIZED: u64 = 3;

    /// Mint `amount` tokens on `contract`.
    public fun basic_token_mint(amount: u64): BasicToken {
        let new_token = BasicToken{value:amount};
        new_token
    }

    /// Burn `amount` tokens from `contract`.
    public fun burn(token: BasicToken) {
        let BasicToken{value: _ } = token;
    }

    /// Create a balance for the account
    public fun create_balance(ctx:&mut TxContext) : Balance {
        let acc_addr = tx_context::sender(ctx);

        /// Perform checks at a higher level
        // assert!(!balance_exists(ctx), E_ALREADY_INITIALIZED);

        let zero_token = BasicToken{value: 0};
        let id = sui::object::new(ctx);
        
        let bal_obj = Balance {
            id: id,
            coins: zero_token,
        };
        
        // transfer::transfer(bal_obj, acc_addr)

        bal_obj
    }

    fun set_balance(bal_obj:&mut Balance, amount: u64) {
        bal_obj.coins.value = amount;
    }

}