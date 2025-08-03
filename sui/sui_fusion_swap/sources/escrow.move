module sui_fusion_swap::escrow {
    use sui_fusion_swap::locking::Key;
    use sui_fusion_swap::basic_token::Balance;
    use sui::event;
    use sui::coin::Coin;
    use std::string;
    use sui::object::uid_to_address;
    use sui::object::borrow_uid;
    use sui_fusion_swap::locking::unlock;
    use sui_fusion_swap::basic_token::create_balance;

    /// Escrow Abstraction Struct
    public struct Escrow<T: store+key> has store, key {
        id: sui::object::UID,
        depositor_id: address,
        depositor_key: Key,
        recipient_id: address,
        obj: sui_fusion_swap::locking::Locked<T>,
        timelock: u64
    }

    public struct CustomEscrow<T: store+key> has store, key {
        id: sui::object::UID,
        depositor_id: address,
        depositor_key: Key,
        custom_key: std::string::String,
        recipient_id: address,
        obj: sui_fusion_swap::locking::Locked<T>,
        timelock: u64
    }

    public struct EscrowCreated has drop, copy {
        /// The creator of the locked object.
        creator: address,
        escrow_id: sui::object::ID,
    }

    /// Error codes
    const E_DEPOSITOR_MISMATCH: u64 = 1;

    /// Implementation of an escrow constructor
    public fun create_escrow<T:store+key>(
        depositor_id: address,
        recipient_id: address,
        timelock: u64,
        obj: T,
        ctx:&mut TxContext,
    ) {
        let (locked, key) = sui_fusion_swap::locking::lock(ctx, obj);
        
        let escrow_id = sui::object::new(ctx);

        let escrow = Escrow {
            id: escrow_id,
            depositor_id,
            depositor_key: key,
            recipient_id,
            obj: locked,
            timelock: timelock
        };

        let escrow_id = object::id(&escrow);

        // Emit an event that the escrow has been created
        let event = EscrowCreated {            
            creator: tx_context::sender(ctx),
            escrow_id: escrow_id
        };

        event::emit(event);
        
        // transfer::transfer(escrow, depositor_id);
        transfer::public_transfer(escrow, depositor_id);
    }

    public struct CoinEscrow<T:store+key> has store, key {
        id: sui::object::UID,
        depositor_id: address,
        recipient_id: address,
        hashed_string: std::string::String,
        timelock: u64,
        obj: Coin<T>,
    }

    public struct CoinEscrowCreated has drop, copy {
        escrow_address: address,
        depositor_id: address,
        recipient_id: address,
        hashed_string: std::string::String,
        timelock: u64
    }

    public fun create_coin_escrow<T:store+key>(
        depositor_id: address,
        recipient_id: address,
        timelock: u64,
        obj: Coin<T>,
        ctx:&mut TxContext
    ) {
        //Validation of inputs, if any
        let escrow_id = sui::object::new(ctx);
        let hashed_string = string::utf8(b"hashed_string");

        let escrow: CoinEscrow<T> = CoinEscrow{
            id: escrow_id,
            depositor_id,
            recipient_id,
            hashed_string,
            timelock: timelock,
            obj,
        };

        let escrow_address = object::uid_to_address(&escrow.id);

        let event = CoinEscrowCreated {
            escrow_address,
            depositor_id,
            recipient_id,
            hashed_string,
            timelock
        };

        event::emit(event);

        transfer::public_transfer(escrow,depositor_id);
    }


    public fun claim_escrow<T: store+key> (
        escrow: Escrow<T>,
        recipient_key: Key,
        ctx: &mut TxContext,
    ) : Key{
        
        let Escrow {
            id: id,
            depositor_id: _depositor_id,
            depositor_key,
            recipient_id,
            obj: locked_obj,
            timelock: _,
        } = escrow;

        assert!(recipient_id == tx_context::sender(ctx), E_DEPOSITOR_MISMATCH);
        assert!(depositor_key == &recipient_key, E_DEPOSITOR_MISMATCH);
        
        let obj: T = sui_fusion_swap::locking::unlock(locked_obj, depositor_key);

        // Delete the escrow object
        sui::object::delete(id);

        sui::transfer::public_transfer(obj, recipient_id);

        recipient_key
    }

    public fun create_custom_escrow<T:store+key>(
        ctx:&mut TxContext,
        depositor_id: address,
        recipient_id: address,
        obj: T,
        timelock: u64,
        custom_key: std::string::String
    ) {
        let (locked, key) = sui_fusion_swap::locking::lock(ctx, obj);
        
        let escrow_id = sui::object::new(ctx);

        let escrow = CustomEscrow {
            id: escrow_id,
            depositor_id,
            depositor_key: key,
            custom_key,
            recipient_id,
            obj: locked,
            timelock: timelock
        };

        sui::transfer::transfer(escrow, depositor_id);

        // Emit an event that the escrow has been created
        // let event = EscrowCreated {            
        //     creator: tx_context::sender(ctx)
        // };
        // event::emit(event)
    }

    public fun create_custom_claim_escrow<T: store+key> (
        ctx: &mut TxContext,
        escrow: CustomEscrow<T>,
        custom_response_key: std::string::String,
    ) {
        let CustomEscrow {
            id: id,
            depositor_id: _depositor_id,
            depositor_key,
            recipient_id,
            obj: locked_obj,
            timelock: _,
            custom_key: _custom_key
        } = escrow;

        assert!(recipient_id == tx_context::sender(ctx), E_DEPOSITOR_MISMATCH);
        assert!(_custom_key == &custom_response_key, E_DEPOSITOR_MISMATCH);

        // let current_time = sui::tx_context::epoch_timestamp_ms(_self) // TODO: Change this implementation in the future
        // assert!(current_time >= escrow.timelock, "Funds are still locked");

        let obj: T = sui_fusion_swap::locking::unlock(locked_obj, depositor_key);

        // Delete the escrow object
        sui::object::delete(id);

        sui::transfer::public_transfer(obj, recipient_id);
        
    }

    public fun create_escrow_for_balance(
        depositor_id: address,
        recipient_id: address,
        value: u64,
        custom_key: std::string::String,
        timelock: u64,
        ctx:&mut TxContext) {
            let obj = sui_fusion_swap::basic_token::create_balance(ctx);
            create_custom_escrow(ctx, depositor_id, recipient_id, obj, timelock, custom_key)
        }

    public fun claim_escrow_for_balance(
        escrow: CustomEscrow<Balance>,
        recipient_key: std::string::String,
        ctx: &mut TxContext) {
            create_custom_claim_escrow(ctx, escrow, recipient_key)
        }
        
    public fun create_escrow_for_basic_token(
        depositor_id: address,
        recipient_id: address,
        obj: Balance,
        timelock: u64,
        ctx:&mut TxContext,) {
            create_escrow( depositor_id, recipient_id, timelock,obj ,ctx)
        }

   
    public fun create_escrow_for_coin<T>(depositor_id:address, recipient_id:address, timelock:u64,obj:Coin<T>,ctx:&mut TxContext){
        create_escrow( depositor_id, recipient_id, timelock,obj, ctx)
    }

    public fun claim_escrow_for_coin<T>(
        escrow:Escrow<Coin<T>>,
        recipient_key: Key,
        ctx:&mut TxContext,) : Key{
            claim_escrow( escrow, recipient_key,ctx)
        }
}