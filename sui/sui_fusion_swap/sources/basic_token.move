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
    public fun create_balance(ctx:&mut TxContext) {
        let acc_addr = tx_context::sender(ctx);

        /// Perform checks at a higher level
        // assert!(!balance_exists(ctx), E_ALREADY_INITIALIZED);

        let zero_token = BasicToken{value: 0};

        let bal_obj = Balance {
            id: object::new(ctx),
            coins: zero_token,
        };

        transfer::transfer(bal_obj, acc_addr)
    }

    fun set_balance(bal_obj:&mut Balance, amount: u64) {
        bal_obj.coins.value = amount;
    }

    /// NOT IMPLEMENTED!!! doesn't work in Sui
    /// On-chain, the querying can't take place, need to use SUI API
    // public fun balance_exists(ctx: &TxContext): bool {
        // let acc_addr = tx_context::sender(ctx);
        // exists<Balance>(acc_addr)
    // }

    // public fun balance(owner: address): u64 acquires Balance {
    //     borrow_global<Balance>(owner).coins.amount
    // }



    /// Initialize the token
    // public entry fun initialize(
    //     account: &signer,
    //     name: vector<u8>,
    //     symbol: vector<u8>,
    //     decimals: u8,
    // ) {
    //     let account_addr = signer::address_of(account);
        
    //     // Ensure the token hasn't been initialized
    //     assert!(!exists<BasicToken>(account_addr), E_ALREADY_INITIALIZED);

    //     // Create the token
    //     move_to(account, BasicToken {
    //         name,
    //         symbol,
    //         decimals,
    //     });
    // }

    // /// Mint tokens to an account
    // public fun mint(account: &signer, amount: u64) {
    //     let account_addr = signer::address_of(account);
    //     assert!(exists<BasicToken>(account_addr), E_NOT_AUTHORIZED);
        
    //     let coins = BasicCoins::mint(amount);
    //     BasicCoins::deposit(account_addr, coins);
    // }
}