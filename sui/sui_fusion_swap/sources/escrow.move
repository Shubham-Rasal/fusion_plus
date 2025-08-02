module sui_fusion_swap::escrow {
    use sui_fusion_swap::locking::Key;
    use sui_fusion_swap::basic_token::Balance;
    use sui::event;
    use sui::coin::Coin;

    /// Escrow Abstraction Struct
    public struct Escrow<T: store+key> has store, key {
        id: sui::object::UID,
        depositor_id: address,
        depositor_key: Key,
        recipient_id: address,
        obj: sui_fusion_swap::locking::Locked<T>,
        timelock: u64
    }

    public struct EscrowCreated has drop, copy {
    /// The creator of the locked object.
    creator: address,
    }

    /// Error codes
    const E_DEPOSITOR_MISMATCH: u64 = 1;

    /// Implementation of an escrow constructor
    public fun create_escrow<T:store+key>(
        ctx:&mut TxContext,
        depositor_id: address,
        recipient_id: address,
        obj: T,
        timelock: u64
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

        sui::transfer::transfer(escrow, depositor_id);

        // Emit an event that the escrow has been created
        let event = EscrowCreated {            
            creator: tx_context::sender(ctx)
        };
        event::emit(event)
    }

    public fun claim_escrow<T: store+key> (
        ctx: &mut TxContext,
        escrow: Escrow<T>,
        recipient_key: Key
    ): Key{
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

        // let current_time = sui::tx_context::epoch_timestamp_ms(_self) // TODO: Change this implementation in the future
        // assert!(current_time >= escrow.timelock, "Funds are still locked");

        
        let obj: T = sui_fusion_swap::locking::unlock(locked_obj, recipient_key);

        // Delete the escrow object
        sui::object::delete(id);

        sui::transfer::public_transfer(obj, recipient_id);

        depositor_key
    }

    public fun create_escrow_for_basic_token(ctx:&mut TxContext,
        depositor_id: address,
        recipient_id: address,
        obj: Balance,
        timelock: u64) {
            create_escrow(ctx, depositor_id, recipient_id, obj, timelock)
        }

    public fun claim_escrow_for_basic_token(ctx: &mut TxContext,
        escrow: Escrow<Balance>,
        recipient_key: Key): Key {
            claim_escrow(ctx, escrow, recipient_key)
        }

    public fun create_escrow_for_coin(ctx:&mut TxContext, depositor_id:address, recipient_id:address, obj:Coin<u64>,timelock:u64){
        create_escrow(ctx, depositor_id, recipient_id, obj, timelock)
    }

    public fun claim_escrow_for_coin(ctx: &mut TxContext,
        escrow: Escrow<Coin<u64>>,
        recipient_key: Key): Key {
            claim_escrow(ctx, escrow, recipient_key)
        }
}