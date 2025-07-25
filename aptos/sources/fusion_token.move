// Reference standard - https://github.com/aptos-labs/aptos-core/blob/main/aptos-move/framework/aptos-framework/sources/aptos_coin.move

module token_addr::fusion_token {
    use std::signer;
    use std::string::String;
    use aptos_framework::coin;
    use aptos_framework::coin::{BurnCapability, FreezeCapability, MintCapability};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_ALREADY_INITIALIZED: u64 = 3;

    /// Account does not have mint capability
    const ENO_CAPABILITIES: u64 = 1;
    /// Mint capability has already been delegated to this specified address
    const EALREADY_DELEGATED: u64 = 2;
    /// Cannot find delegation of mint capability to this account
    const EDELEGATION_NOT_FOUND: u64 = 3;

    /// Token struct
    struct FusionToken {}

    /// Capabilities holder
    struct Capabilities has key {
        mint_cap: MintCapability<FusionToken>,
        burn_cap: BurnCapability<FusionToken>,
        freeze_cap: FreezeCapability<FusionToken>,
    }

    /// Initialize the token
    public entry fun initialize(
        account: &signer,
        name: String,
        symbol: String,
        decimals: u8,
        monitor_supply: bool,
    ) {
        let account_addr = signer::address_of(account);
        
        // Ensure the token hasn't been initialized
        assert!(!exists<Capabilities>(account_addr), E_ALREADY_INITIALIZED);

        // Create the token
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<FusionToken>(
            account,
            name,
            symbol,
            decimals,
            monitor_supply,
        );

        // Store capabilities
        move_to(account, Capabilities {
            mint_cap,
            burn_cap,
            freeze_cap,
        });
    }

    /// Register an account to hold the token
    public entry fun register(account: &signer) {
        coin::register<FusionToken>(account);
    }

    /// Mint new tokens
    public entry fun mint(
        account: &signer,
        to: address,
        amount: u64,
    ) acquires Capabilities {
        let account_addr = signer::address_of(account);
        
        // Ensure caller has mint capability
        assert!(exists<Capabilities>(account_addr), E_NOT_AUTHORIZED);
        
        let capabilities = borrow_global<Capabilities>(account_addr);
        let coins = coin::mint(amount, &capabilities.mint_cap);
        coin::deposit(to, coins);
    }

    /// Burn tokens from caller's account
    public entry fun burn(
        account: &signer,
        amount: u64,
    ) acquires Capabilities {
        let account_addr = signer::address_of(account);
        
        // Withdraw coins from the account
        let coins = coin::withdraw<FusionToken>(account, amount);
        
        // Get burn capability
        let capabilities = borrow_global<Capabilities>(@mytoken_addr);
        coin::burn(coins, &capabilities.burn_cap);
    }

    /// Transfer tokens between accounts
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64,
    ) {
        coin::transfer<FusionToken>(from, to, amount);
    }

    /// Get balance of an account
    public fun balance(owner: address): u64 {
        coin::balance<FusionToken>(owner)
    }

    /// Get token supply
    public fun supply(): u128 {
        let supply = coin::supply<FusionToken>();
        if (std::option::is_some(&supply)) {
            *std::option::borrow(&supply)
        } else {
            0
        }
    }


}